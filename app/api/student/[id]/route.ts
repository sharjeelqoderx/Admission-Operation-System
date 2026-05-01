import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { AddStudentSchema } from "@/types/schemas/student"

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
            .eq("role", "STUDENT")
            .single()

        if (profileError || !profile) {
            return NextResponse.json(
                { error: "Student not found" },
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
            .maybeSingle()

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
 * PUT /api/student/[id]
 * Update student profile + details + education
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createSupabaseServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { id } = await params
        const body = await req.json()
        const data = AddStudentSchema.partial().parse(body)

        // 1. Update profile
        const { error: profileError } = await supabase
            .from("profile")
            .update({
                name: data.full_name,
                email: data.email,
                phone: data.phone,
                date_of_birth: data.dob,
                avatar_url: data.avatar_url,
                gender: data.gender
                    ? (data.gender.toUpperCase() as "MALE" | "FEMALE")
                    : undefined,
            })
            .eq("id", id)

        if (profileError) {
            console.error(profileError)
            return NextResponse.json(
                { error: "Profile update failed" },
                { status: 400 }
            )
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
            return NextResponse.json(
                { error: "Student update failed" },
                { status: 400 }
            )
        }

        // 3. Upsert education
        if (data.qualification || data.institution_name || data.gpa) {
            const { error: eduError } = await supabase
                .from("education")
                .upsert(
                    {
                        profile_id: id,
                        qualification: data.qualification || "",
                        institution_name: data.institution_name || "",
                        cumulative_gpa: data.gpa || null,
                    },
                    { onConflict: "profile_id" }
                )

            if (eduError) {
                console.error(eduError)
                return NextResponse.json(
                    { error: "Education update failed" },
                    { status: 400 }
                )
            }
        }

        return NextResponse.json(
            { message: "Student updated successfully" },
            { status: 200 }
        )
    } catch (e: any) {
        console.error("PUT /student/[id] error:", e)

        if (e.name === "ZodError") {
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