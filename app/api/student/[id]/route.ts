import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server"
import { upsertStudentDocument } from "@/lib/supabase/upsert-student-document"
import { uploadPublicImage } from "@/lib/supabase/upload-public-image"
import { STUDENT_DOCUMENT_TYPE_IDS } from "@/lib/constants/document-types"
import { formatFullName } from "@/lib/utils/profile"
import { requiresApsRequirement } from "@/lib/utils/aps"
import { isUniversityRole } from "@/lib/auth/university-role"
import { Role } from "@/types/enums/role"

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

        let qualificationById = new Map<
            string,
            {
                id: string
                name: string
                credits?: number | null
                location?: string | null
                language_of_study?: string | null
                duration?: string | null
                level_id: string | null
                level?: { id: string; name: string } | null
            }
        >()

        if (qualificationIds.length > 0) {
            const { data: educationTypes } = await supabase
                .from("education_type")
                .select("id, name, level_id, linked_level:level_id(id, name)")
                .in("id", qualificationIds)

            for (const row of educationTypes ?? []) {
                const linkedLevel = (row.linked_level as unknown as { id: string; name: string } | null)
                qualificationById.set(row.id, {
                    id: row.id,
                    name: row.name,
                    level_id: row.level_id,
                    level: linkedLevel ?? { id: row.id, name: row.name },
                })
            }

            const unresolvedIds = qualificationIds.filter((id) => !qualificationById.has(id))
            if (unresolvedIds.length > 0) {
                const { data: qualificationDegrees } = await supabase
                    .from("degree")
                    .select("id, name, credits, location, language_of_study, duration, level_id")
                    .in("id", unresolvedIds)

                const levelIds = (qualificationDegrees ?? [])
                    .map((d) => d.level_id)
                    .filter((id): id is string => Boolean(id))

                let levelById = new Map<string, { id: string; name: string }>()
                if (levelIds.length > 0) {
                    const { data: levels } = await supabase
                        .from("levels")
                        .select("id, name")
                        .in("id", levelIds)
                    levelById = new Map((levels ?? []).map((level) => [level.id, level]))
                }

                for (const degree of qualificationDegrees ?? []) {
                    qualificationById.set(degree.id, {
                        ...degree,
                        level: degree.level_id ? levelById.get(degree.level_id) ?? null : null,
                    })
                }
            }
        }

        const enrichedEducation = (education ?? []).map((row) => ({
            ...row,
            qualification_degree: row.qualification
                ? qualificationById.get(row.qualification) ?? null
                : null,
        }))

        return NextResponse.json(
            {
                data: {
                    ...profile,
                    name: formatFullName(profile.first_name, profile.last_name),
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
        const getString = (key: string) => { 
            const v = formData.get(key); 
            return typeof v === "string" && v.trim() !== "" ? v : undefined 
        }
        const getFile = (key: string) => { const v = formData.get(key); return v instanceof File ? v : undefined }

        const academicRaw = getString("academic_background")
        const academic = academicRaw ? JSON.parse(academicRaw) : []

        const data = {
            title: getString("title"),
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

        // Check user's role
        const { data: meProfile } = await supabase
            .from("profile")
            .select("id, role")
            .eq("id", user.id)
            .maybeSingle()

        if (!meProfile) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (meProfile.role !== Role.AGENT && !isUniversityRole(meProfile.role)) {
            // If user is a student, they can only update their own profile
            if (meProfile.role === Role.STUDENT && user.id !== id) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 })
            } else if (meProfile.role !== Role.STUDENT) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 })
            }
        }

        // Use service role client for database updates to bypass RLS
        const serviceSupabase = createSupabaseServiceClient()

        // 1. Update profile
        const avatarUpload = data.avatar_url
            ? await uploadPublicImage({ supabase: serviceSupabase, bucket: "student-admission", userId: id, file: data.avatar_url })
            : null

        const passportUpload = data.passport_file_url
            ? await uploadPublicImage({ supabase: serviceSupabase, bucket: "student-admission", userId: `${id}/passport`, file: data.passport_file_url })
            : null

        const { error: profileError } = await serviceSupabase
            .from("profile")
            .update({
                ...(data.title !== undefined ? { title: data.title } : {}),
                ...(data.first_name !== undefined ? { first_name: data.first_name } : {}),
                ...(data.last_name !== undefined ? { last_name: data.last_name } : {}),
                ...(data.email !== undefined ? { email: data.email } : {}),
                ...(data.phone !== undefined ? { phone: data.phone } : {}),
                ...(data.dob !== undefined ? { date_of_birth: data.dob } : {}),
                ...(avatarUpload ? { avatar_url: avatarUpload.publicUrl } : {}),
                ...(data.gender !== undefined
                    ? { gender: data.gender.toUpperCase() as "MALE" | "FEMALE" }
                    : {}),
            })
            .eq("id", id)

        if (profileError) {
            console.error("Profile update error:", JSON.stringify(profileError, null, 2))
            return NextResponse.json({ error: "Profile update failed", details: profileError }, { status: 400 })
        }

        // 2. Upsert student details
        const { error: studentError } = await serviceSupabase
            .from("student")
            .upsert(
                {
                    profile_id: id,
                    ...(data.country !== undefined ? { country: data.country } : {}),
                    ...(data.state !== undefined ? { state: data.state } : {}),
                    ...(data.city !== undefined ? { city: data.city } : {}),
                    ...(data.nationality !== undefined ? { nationality: data.nationality } : {}),
                    ...(data.guardian_email !== undefined ? { guardian_email: data.guardian_email } : {}),
                    ...(data.guardian_phone !== undefined ? { guardian_phone: data.guardian_phone } : {}),
                    ...(passportUpload ? { passport_file_url: passportUpload.publicUrl } : {}),
                    ...(data.country !== undefined
                        ? { aps_requirement: requiresApsRequirement(data.country) }
                        : {}),
                },
                { onConflict: "profile_id" }
            )

        if (studentError) {
            console.error("Student update error:", JSON.stringify(studentError, null, 2))
            return NextResponse.json({ error: "Student update failed", details: studentError }, { status: 400 })
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

            const gradeType =
                row.grade_type === "gpa"
                    ? "gpa"
                    : row.grade_type === "percentage"
                      ? "percentage"
                      : null
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
                const { error: eduError } = await serviceSupabase
                    .from("education")
                    .update(payload)
                    .eq("id", row.id)
                if (eduError) {
                    console.error("Education update error:", JSON.stringify(eduError, null, 2))
                    return NextResponse.json({ error: "Education update failed", details: eduError }, { status: 400 })
                }
            } else {
                const { error: eduError } = await serviceSupabase
                    .from("education")
                    .insert(payload)
                if (eduError) {
                    console.error("Education insert error:", JSON.stringify(eduError, null, 2))
                    return NextResponse.json({ error: "Education update failed", details: eduError }, { status: 400 })
                }
            }
        }

        // 4. Upsert passport document if provided
        if (data.passport_file_url instanceof File) {
            await upsertStudentDocument({
                supabase: serviceSupabase,
                profileId: id,
                uploadedByProfileId: user.id,
                documentTypeId: STUDENT_DOCUMENT_TYPE_IDS.PASSPORT,
                file: data.passport_file_url,
                storageSubpath: "passport",
            })
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