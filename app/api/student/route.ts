import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { AddStudentSchema } from "@/types/schemas/student"
import { uploadPublicImage } from "@/lib/supabase/upload-public-image"

export async function GET(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get agent row for logged-in user
        const { data: agentRow } = await supabase
            .from("agent")
            .select("id")
            .eq("profile_id", user.id)
            .maybeSingle()

        if (!agentRow) {
            return NextResponse.json({ error: "Agent profile not found" }, { status: 400 })
        }

        // Fetch students created by this agent with their profile
        const { data: students, error } = await supabase
            .from("student")
            .select(`
                *,
                profile:profile_id (*)
            `)
            .eq("created_by_agent_id", agentRow.id)
            .order("created_at", { ascending: false })

        if (error) {
            console.error("Supabase Error:", error)
            return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 })
        }

        return NextResponse.json({ data: students }, { status: 200 })
    } catch (e) {
        console.error("Error in GET /api/student:", e)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const formData = await req.formData()

        const getString = (key: string) => {
            const v = formData.get(key)
            return typeof v === "string" ? v : ""
        }
        const getFile = (key: string) => {
            const v = formData.get(key)
            return v instanceof File ? v : undefined
        }

        const validatedData = AddStudentSchema.parse({
            full_name: getString("full_name"),
            email: getString("email"),
            phone: getString("phone"),
            dob: getString("dob"),
            gender: getString("gender"),
            country: getString("country"),
            nationality: getString("nationality"),
            guardian_email: getString("guardian_email"),
            guardian_phone: getString("guardian_phone"),
            qualification: getString("qualification"),
            institution_name: getString("institution_name"),
            gpa: getString("gpa"),
            avatar_url: getFile("avatar"),
        })

        // Only AGENT can create students, and we store agent.id in student.created_by_agent_id
        const { data: meProfile, error: meProfileError } = await supabase
            .from("profile")
            .select("id, role")
            .eq("id", user.id)
            .maybeSingle()

        if (meProfileError || !meProfile) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        if (meProfile.role !== "AGENT") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { data: agentRow, error: agentError } = await supabase
            .from("agent")
            .select("id")
            .eq("profile_id", user.id)
            .maybeSingle()

        if (agentError || !agentRow) {
            return NextResponse.json({ error: "Agent profile not found" }, { status: 400 })
        }

        // 1. Create auth user with server client
        const { data: authData, error: createUserError } = await supabase.auth.signUp({
            email: validatedData.email,
            password: 'student@123',
            options: {
                data: {
                    full_name: validatedData.full_name,
                    role: "STUDENT",
                },
            },
        })

        if (createUserError || !authData.user) {
            console.error("Error creating auth user:", createUserError)
            return NextResponse.json({
                error: "Failed to create user account",
                details: createUserError?.message
            }, { status: 400 })
        }

        const newUserId = authData.user.id

        const bucket = "student-admission"
        const avatarUpload = validatedData.avatar_url
            ? await uploadPublicImage({ supabase, bucket, userId: newUserId, file: validatedData.avatar_url })
            : null

        // 2. Upsert profile linked to auth user
        const { data: profile, error: profileError } = await supabase
            .from("profile")
            .upsert({
                id: newUserId,
                name: validatedData.full_name,
                email: validatedData.email,
                phone: validatedData.phone || null,
                date_of_birth: validatedData.dob || null,
                gender: (validatedData.gender?.toUpperCase() === "MALE" || validatedData.gender?.toUpperCase() === "FEMALE")
                    ? validatedData.gender.toUpperCase() as "MALE" | "FEMALE"
                    : null,
                avatar_url: avatarUpload?.publicUrl ?? null,
                role: "STUDENT",
            })
            .select()
            .single()

        if (profileError) {
            console.error("Error creating student profile:", profileError)
            return NextResponse.json({
                error: "Failed to create student profile",
                details: profileError,
            }, { status: 400 })
        }

        // 3. Upsert student detail row
        const { error: studentError } = await supabase
            .from("student")
            .upsert({
                profile_id: newUserId,
                created_by_agent_id: agentRow.id,
                country: validatedData.country || null,
                nationality: validatedData.nationality || null,
                guardian_email: validatedData.guardian_email || null,
                guardian_phone: validatedData.guardian_phone || null,
            }, { onConflict: "profile_id" })

        if (studentError) {
            console.error("Error creating student detail:", studentError)
            return NextResponse.json({
                error: "Failed to create student details",
                details: studentError,
            }, { status: 400 })
        }

        // 4. Create or update education row if provided
        if (validatedData.qualification || validatedData.institution_name || validatedData.gpa) {
            const payload = {
                profile_id: newUserId,
                qualification: validatedData.qualification || "",
                institution_name: validatedData.institution_name || "",
                cumulative_gpa: validatedData.gpa || null,
            }

            const { data: existingEdu } = await supabase
                .from("education")
                .select("id")
                .eq("profile_id", newUserId)
                .maybeSingle()

            const { error: eduError } = existingEdu
                ? await supabase.from("education").update(payload).eq("id", existingEdu.id)
                : await supabase.from("education").insert(payload)

            if (eduError) {
                console.error("Error saving education:", eduError)
                return NextResponse.json({
                    error: "Failed to save education",
                    details: eduError,
                }, { status: 400 })
            }
        }

        return NextResponse.json({ data: profile, message: "Student created successfully" }, { status: 201 })
    } catch (e: any) {
        console.error("Error in POST /api/student:", e)
        if (e.name === "ZodError") {
            return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 })
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
