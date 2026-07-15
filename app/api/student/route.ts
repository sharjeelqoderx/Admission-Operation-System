import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { StudentCreateFormSchema } from "@/types/schemas/student"
import { uploadPublicImage } from "@/lib/supabase/upload-public-image"
import { upsertStudentDocument } from "@/lib/supabase/upsert-student-document"
import { STUDENT_DOCUMENT_TYPE_IDS } from "@/lib/constants/document-types"
import { requiresApsRequirement } from "@/lib/utils/aps"
import { fetchStudentsListForAgent } from "@/lib/student/list"

export async function GET(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const q = searchParams.get("q") ?? ""
        const status = searchParams.get("status") ?? "all"
        const page = parseInt(searchParams.get("page") || "1", 10)
        const limit = parseInt(searchParams.get("limit") || "10", 10)

        const result = await fetchStudentsListForAgent(supabase, user.id, {
            q,
            status,
            page,
            limit,
        })

        if ("error" in result) {
            const status = result.error === "Forbidden" ? 403 : 400
            return NextResponse.json({ error: result.error }, { status })
        }

        return NextResponse.json({ data: result.data, pagination: result.pagination }, { status: 200 })
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

        let formData: FormData
        try {
            formData = await req.formData()
        } catch (parseError) {
            console.error("[POST /api/student] formData parse error:", parseError)
            return NextResponse.json(
                {
                    error:
                        "Failed to read uploaded files. The request may be too large or the upload was interrupted.",
                },
                { status: 400 }
            )
        }

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

        const validatedData = StudentCreateFormSchema.parse({
            title: getString("title") || undefined,
            first_name: getString("first_name"),
            last_name: getString("last_name"),
            email: getString("email"),
            phone: getString("phone"),
            dob: getString("dob"),
            gender: getString("gender"),
            country: getString("country"),
            state: getString("state"),
            city: getString("city"),
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
                { error: "University Partner profile not found" },
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

        const fullName = `${validatedData.first_name} ${validatedData.last_name}`
        const { data: authData, error: createUserError } =
            await supabase.auth.signUp({
                email: validatedData.email,
                password: "student@123",
                options: {
                    data: {
                        title: validatedData.title || "",
                        full_name: fullName,
                        first_name: validatedData.first_name,
                        last_name: validatedData.last_name,
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
                title: validatedData.title || null,
                first_name: validatedData.first_name,
                last_name: validatedData.last_name,
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
                state: validatedData.state || null,
                city: validatedData.city || null,
                nationality: validatedData.nationality || null,
                guardian_email: validatedData.guardian_email || null,
                guardian_phone: validatedData.guardian_phone || null,
                passport_file_url: passportUpload?.publicUrl ?? null,
                aps_requirement: requiresApsRequirement(validatedData.country),
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
            const educationRows = validatedData.academic_background.map((item) => ({
                profile_id: newUserId,
                qualification: item.qualification,
                institution_name: item.institution_name,
                grade_type: item.grade_type,
                gpa: item.grade_type === "gpa" ? parseFloat(item.gpa) : null,
                obtained_marks:
                    item.grade_type === "percentage" ? parseFloat(item.obtained_marks) : null,
                total_marks:
                    item.grade_type === "percentage" ? parseFloat(item.total_marks) : null,
            }))

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

        /* ---------------- PASSPORT DOCUMENT ---------------- */
        if (validatedData.passport_file_url instanceof File) {
            await upsertStudentDocument({
                supabase,
                profileId: newUserId,
                uploadedByProfileId: user.id,
                documentTypeId: STUDENT_DOCUMENT_TYPE_IDS.PASSPORT,
                file: validatedData.passport_file_url,
                storageSubpath: "passport",
            })
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
        console.error("[POST /api/student] error:", e?.message ?? e)
        if (e?.name === "ZodError") {
            return NextResponse.json(
                { error: "Validation failed", details: e.errors },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: e?.message ?? "Internal Server Error" },
            { status: 500 }
        )
    }
}