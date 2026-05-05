import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

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

        // 3. Education
        const { data: education } = await supabase
            .from("education")
            .select("*")
            .eq("profile_id", id)
        return NextResponse.json(
            {
                data: {
                    ...profile,
                    student: student || null,
                    education: education || null,
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
            full_name: getString("full_name"),
            email: getString("email"),
            phone: getString("phone"),
            dob: getString("dob"),
            gender: getString("gender"),
            country: getString("country"),
            nationality: getString("nationality"),
            guardian_email: getString("guardian_email"),
            guardian_phone: getString("guardian_phone"),
            avatar: getFile("avatar"),
            academic,
        }

        // 1. Update profile
        const avatarUpload = data.avatar
            ? await (await import("@/lib/supabase/upload-public-image")).uploadPublicImage({ supabase, bucket: "student-admission", userId: id, file: data.avatar })
            : null

        const { error: profileError } = await supabase
            .from("profile")
            .update({
                name: data.full_name,
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
                    nationality: data.nationality,
                    guardian_email: data.guardian_email,
                    guardian_phone: data.guardian_phone,
                },
                { onConflict: "profile_id" }
            )

        if (studentError) {
            console.error(studentError)
            return NextResponse.json({ error: "Student update failed" }, { status: 400 })
        }

        // 3. Update or insert education rows
        for (const row of data.academic) {
            if (!row.qualification && !row.institution_name && !row.gpa) continue

            const payload = {
                profile_id: id,
                qualification: row.qualification || "",
                institution_name: row.institution_name || "",
                cumulative_gpa: row.gpa || null,
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

        // 1. Delete education
        await supabase.from("education").delete().eq("profile_id", id)

        // 2. Delete student details
        await supabase.from("student").delete().eq("profile_id", id)

        // 3. Delete profile
        const { error: profileError } = await supabase
            .from("profile")
            .delete()
            .eq("id", id)

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