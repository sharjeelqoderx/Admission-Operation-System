import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server"

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createSupabaseServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { id } = await params

        // 1. Profile
        const { data: profile, error: profileError } = await supabase
            .from("profile")
            .select("*")
            .eq("id", id)
            .single()

        if (profileError || !profile) {
            console.error("Profile not found or error:", profileError)
            return NextResponse.json(
                { error: "Student profile not found" },
                { status: 404 }
            )
        }

        // 2. Student details
        const { data: student } = await supabase
            .from("student")
            .select("*")
            .eq("profile_id", id)
            .maybeSingle()

        // 3. Education records
        const { data: education } = await supabase
            .from("education")
            .select("*")
            .eq("profile_id", id)

        const qualificationIds = [
            ...new Set(
                (education ?? [])
                    .map((row) => row.qualification)
                    .filter((value): value is string => Boolean(value))
            ),
        ]

        let qualificationDegreeById = new Map<
            string,
            {
                id: string
                name: string
                credits: number | null
                location: string | null
                language_of_study: string | null
                duration: string | null
            }
        >()

        if (qualificationIds.length > 0) {
            const { data: qualificationDegrees } = await supabase
                .from("degree")
                .select("id, name, credits, location, language_of_study, duration")
                .in("id", qualificationIds)

            qualificationDegreeById = new Map(
                (qualificationDegrees ?? []).map((degree) => [degree.id, degree])
            )
        }

        const enrichedEducation = (education ?? []).map((row) => ({
            ...row,
            qualification_degree: row.qualification
                ? qualificationDegreeById.get(row.qualification) ?? null
                : null,
        }))

        return NextResponse.json(
            {
                data: {
                    ...profile,
                    student: student || null,
                    education: enrichedEducation,
                },
            },
            { status: 200 }
        )
    } catch (e) {
        console.error("GET /student/[id] error:", e)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/student/[id]
 * Update student profile + details + education (accepts FormData)
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createSupabaseServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { id } = await params
        const formData = await req.formData()
        const getString = (key: string) => { const v = formData.get(key); return typeof v === "string" ? v : undefined }
        const getFile = (key: string) => { const v = formData.get(key); return v instanceof File ? v : undefined }

        const academicRaw = getString("academic_background")
        const academic = academicRaw ? JSON.parse(academicRaw) : []

        const data = {
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
            academic,
        }


        // 1. Update profile
        const avatarUpload = data.avatar_url
            ? await (await import("@/lib/supabase/upload-public-image")).uploadPublicImage({ supabase, bucket: "student-admission", userId: id, file: data.avatar_url })
            : null

        const passportUpload = data.passport_file_url
            ? await (await import("@/lib/supabase/upload-public-image")).uploadPublicImage({ supabase, bucket: "student-admission", userId: `${id}/passport`, file: data.passport_file_url })
            : null

        const fullName = data.first_name && data.last_name ? `${data.first_name} ${data.last_name}` : undefined
        const { error: profileError } = await supabase
            .from("profile")
            .update({
                ...(fullName ? { name: fullName } : {}),
                ...(data.first_name ? { first_name: data.first_name } : {}),
                ...(data.last_name ? { last_name: data.last_name } : {}),
                email: data.email,
                phone: data.phone,
                date_of_birth: data.dob,
                ...(avatarUpload ? { avatar_url: avatarUpload.publicUrl } : {}),
                gender: data.gender
                    ? (data.gender.toUpperCase() as "MALE" | "FEMALE")
                    : undefined,
            })
            .eq("id", id)

        if (profileError) {
            console.error(profileError)
            return NextResponse.json({ error: "Profile update failed" }, { status: 400 })
        }

        // 2. Upsert student details
        const { error: studentError } = await supabase
            .from("student")
            .upsert(
                {
                    profile_id: id,
                    country: data.country,
                    state: data.state,
                    city: data.city,
                    nationality: data.nationality,
                    guardian_email: data.guardian_email,
                    guardian_phone: data.guardian_phone,
                    ...(passportUpload ? { passport_file_url: passportUpload.publicUrl } : {}),
                },
                { onConflict: "profile_id" }
            )

        if (studentError) {
            console.error(studentError)
            return NextResponse.json({ error: "Student update failed" }, { status: 400 })
        }

        // 3. Update or insert education rows
        for (const row of data.academic) {
            if (
                !row.qualification &&
                !row.institution_name &&
                !row.gpa &&
                !row.obtained_marks &&
                !row.total_marks
            ) {
                continue
            }

            const gradeType = row.grade_type === "gpa" ? "gpa" : "percentage"
            const payload = {
                profile_id: id,
                qualification: row.qualification || "",
                institution_name: row.institution_name || "",
                grade_type: gradeType,
                gpa: gradeType === "gpa" && row.gpa ? parseFloat(row.gpa) : null,
                obtained_marks:
                    gradeType === "percentage" && row.obtained_marks
                        ? parseFloat(row.obtained_marks)
                        : null,
                total_marks:
                    gradeType === "percentage" && row.total_marks
                        ? parseFloat(row.total_marks)
                        : null,
            }

            if (row.id) {
                const { error: eduError } = await supabase
                    .from("education")
                    .update(payload)
                    .eq("id", row.id)
                if (eduError) {
                    console.error(eduError)
                    return NextResponse.json({ error: "Education update failed" }, { status: 400 })
                }
            } else {
                const { error: eduError } = await supabase
                    .from("education")
                    .insert(payload)
                if (eduError) {
                    console.error(eduError)
                    return NextResponse.json({ error: "Education update failed" }, { status: 400 })
                }
            }
        }

        return NextResponse.json({ message: "Student updated successfully" }, { status: 200 })
    } catch (e: any) {
        console.error("PATCH /student/[id] error:", e)
        if (e.name === "ZodError") {
            return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 })
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

/**
 * DELETE /api/student/[id]
 * Delete student completely
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createSupabaseServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { id } = await params

        // First, look up the student record to get the profile_id
        const { data: student, error: studentError } = await supabase
            .from("student")
            .select("profile_id")
            .eq("id", id)
            .maybeSingle()

        if (studentError || !student) {
            return NextResponse.json({ error: "Student not found" }, { status: 404 })
        }

        const profileId = student.profile_id

        // Use service role client to bypass RLS for admin operations
        const serviceSupabase = createSupabaseServiceClient()

        // 1. Delete education
        await serviceSupabase.from("education").delete().eq("profile_id", profileId)

        // 2. Delete student details
        await serviceSupabase.from("student").delete().eq("profile_id", profileId)

        // 3. Delete profile
        const { error: profileError } = await serviceSupabase
            .from("profile")
            .delete()
            .eq("id", profileId)

        if (profileError) {
            console.error(profileError)
            return NextResponse.json(
                { error: "Failed to delete student" },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { message: "Student deleted successfully" },
            { status: 200 }
        )
    } catch (e) {
        console.error("DELETE /student/[id] error:", e)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}