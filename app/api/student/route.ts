import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { StudentFormSchema } from "@/types/schemas/student"
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

        const { searchParams } = new URL(req.url)
        const q = searchParams.get("q")
        const status = searchParams.get("status")
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "10")

        // Fetch students created by this agent with their profile
        let query = supabase
            .from("student")
            .select(`
                *,
                profile:profile_id (*)
            `)
            .eq("created_by_agent_id", agentRow.id)

        if (status && status !== "all") {
            // We'll filter status in-memory below to avoid DB errors if column is missing
        }

        let { data: students, error } = await query.order("created_at", { ascending: false })

        let pagination = {
            total: 0,
            page,
            limit,
            totalPages: 0
        }

        if (students) {
            // In-memory filtering for both search (q) and status
            const searchTerm = q?.toLowerCase() || ""
            const statusFilter = status?.toLowerCase() || "all"

            students = students.filter(s => {
                // 1. Status Filter
                const studentStatus = (s.status || "CREATED").toLowerCase()
                if (statusFilter !== "all" && studentStatus !== statusFilter) {
                    return false
                }

                // 2. Search Filter
                if (searchTerm) {
                    const studentCode = s.student_code?.toLowerCase() || ""
                    const country = s.country?.toLowerCase() || ""
                    const profileName = s.profile?.name?.toLowerCase() || ""
                    const profileEmail = s.profile?.email?.toLowerCase() || ""

                    return studentCode.includes(searchTerm) ||
                        country.includes(searchTerm) ||
                        profileName.includes(searchTerm) ||
                        profileEmail.includes(searchTerm)
                }

                return true
            })

            pagination.total = students.length
            pagination.totalPages = Math.ceil(students.length / limit)

            // Apply pagination
            const start = (page - 1) * limit
            students = students.slice(start, start + limit)
        }

        if (error) {
            console.error("Supabase Error:", error)
            return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 })
        }

        return NextResponse.json({ data: students, pagination }, { status: 200 })
    } catch (e) {
        console.error("Error in GET /api/student:", e)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

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

        const academicRaw = getString("academic_background")
        const academic_background = academicRaw ? JSON.parse(academicRaw) : []

        const validatedData = StudentFormSchema.parse({
            full_name: getString("full_name"),
            email: getString("email"),
            phone: getString("phone"),
            dob: getString("dob"),
            gender: getString("gender"),
            country: getString("country"),
            nationality: getString("nationality"),
            guardian_email: getString("guardian_email"),
            guardian_phone: getString("guardian_phone"),
            avatar_url: getFile("avatar_url"),
            passport_file_url: getFile("passport_file_url"),
            academic_background,
        })

        const { data: meProfile } = await supabase
            .from("profile")
            .select("id, role")
            .eq("id", user.id)
            .maybeSingle()

        if (!meProfile) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (meProfile.role !== "AGENT") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { data: agentRow } = await supabase
            .from("agent")
            .select("id")
            .eq("profile_id", user.id)
            .maybeSingle()

        if (!agentRow) {
            return NextResponse.json(
                { error: "Agent profile not found" },
                { status: 400 }
            )
        }


        const { data: existingProfile } = await supabase
            .from("profile")
            .select("id, role")
            .eq("email", validatedData.email)
            .maybeSingle()

        if (existingProfile) {
            const msg = existingProfile.role === "STUDENT"
                ? "A student with this email already exists."
                : `This email is already registered as a ${existingProfile.role.toLowerCase()} account.`
            return NextResponse.json({ error: msg }, { status: 409 })
        }

        const { data: authData, error: createUserError } =
            await supabase.auth.signUp({
                email: validatedData.email,
                password: "student@123",
                options: {
                    data: {
                        full_name: validatedData.full_name,
                        role: "STUDENT",
                    },
                },
            })

        if (createUserError || !authData?.user) {
            const msg = createUserError?.message?.toLowerCase().includes("already")
                ? "An account with this email already exists."
                : createUserError?.message ?? "Failed to create user account"
            return NextResponse.json({ error: msg }, { status: 400 })
        }

        const newUserId = authData.user.id

        const bucket = "student-admission"

        const avatarUpload = validatedData.avatar_url
            ? await uploadPublicImage({
                supabase,
                bucket,
                userId: newUserId,
                file: validatedData.avatar_url,
            })
            : null

        const passportUpload = validatedData.passport_file_url
            ? await uploadPublicImage({
                supabase,
                bucket,
                userId: `${newUserId}/passport`,
                file: validatedData.passport_file_url,
            })
            : null

        /* ---------------- PROFILE CREATE ---------------- */
        const { data: profile, error: profileError } = await supabase
            .from("profile")
            .upsert({
                id: newUserId,
                name: validatedData.full_name,
                email: validatedData.email,
                phone: validatedData.phone || null,
                date_of_birth: validatedData.dob || null,
                gender:
                    validatedData.gender?.toUpperCase() === "MALE" ||
                        validatedData.gender?.toUpperCase() === "FEMALE"
                        ? (validatedData.gender.toUpperCase() as
                            | "MALE"
                            | "FEMALE")
                        : null,
                avatar_url: avatarUpload?.publicUrl ?? null,
                role: "STUDENT",
            })
            .select()
            .single()

        if (profileError) {
            return NextResponse.json(
                {
                    error: "Failed to create student profile",
                    details: profileError,
                },
                { status: 400 }
            )
        }

        /* ---------------- STUDENT CREATE ---------------- */
        const generateStudentCode = () => {
            const randomDigits = Math.floor(1000 + Math.random() * 9000).toString()
            return `FDM-${randomDigits}`
        }

        let studentCode = generateStudentCode()

        let isUnique = false
        let attempts = 0
        while (!isUnique && attempts < 5) {
            const { data: existing } = await supabase
                .from("student")
                .select("id")
                .eq("student_code", studentCode)
                .maybeSingle()

            if (!existing) {
                isUnique = true
            } else {
                studentCode = generateStudentCode()
                attempts++
            }
        }

        const { error: studentError } = await supabase.from("student").upsert(
            {
                profile_id: newUserId,
                created_by_agent_id: agentRow.id,
                student_code: studentCode,
                country: validatedData.country || null,
                nationality: validatedData.nationality || null,
                guardian_email: validatedData.guardian_email || null,
                guardian_phone: validatedData.guardian_phone || null,
                passport_file_url: passportUpload?.publicUrl ?? null,
            },
            { onConflict: "profile_id" }
        )

        if (studentError) {
            return NextResponse.json(
                {
                    error: "Failed to create student details",
                    details: studentError,
                },
                { status: 400 }
            )
        }

        /* ---------------- EDUCATION (MULTIPLE) ---------------- */
        if (validatedData.academic_background?.length) {
            const educationRows = validatedData.academic_background.map(
                (item: any) => ({
                    profile_id: newUserId,
                    qualification: item.qualification,
                    institution_name: item.institution_name,
                    cumulative_gpa: item.gpa,
                })
            )

            const { error: deleteError } = await supabase
                .from("education")
                .delete()
                .eq("profile_id", newUserId)

            if (deleteError) {
                return NextResponse.json(
                    {
                        error: "Failed to reset education",
                        details: deleteError,
                    },
                    { status: 400 }
                )
            }

            const { error: eduError } = await supabase
                .from("education")
                .insert(educationRows)

            if (eduError) {
                return NextResponse.json(
                    {
                        error: "Failed to save education",
                        details: eduError,
                    },
                    { status: 400 }
                )
            }
        }

        /* ---------------- SUCCESS ---------------- */
        return NextResponse.json(
            {
                data: profile,
                message: "Student created successfully",
            },
            { status: 201 }
        )
    } catch (e: any) {
        if (e?.name === "ZodError") {
            return NextResponse.json(
                { error: "Validation failed", details: e.errors },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}