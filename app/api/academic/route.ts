import { NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ok, err } from "@/lib/api"
import { SaveAcademicsSchema } from "@/types/schemas/academic"

export async function POST(req: NextRequest) {
    const body = await req.json()
    const parsed = SaveAcademicsSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.issues[0].message, 400)

    const { userId, academics } = parsed.data

    const qualificationIds = academics.map((a) => a.qualification)
    if (new Set(qualificationIds).size !== qualificationIds.length) {
        return err("Duplicate degree selected. Each degree can only be added once.", 400)
    }

    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return err("Unauthorized", 401)
    if (user.id !== userId) return err("Forbidden", 403)

    await supabase.from("education").delete().eq("profile_id", userId)

    if (academics.length > 0) {
        const payload = academics.map((data) => ({
            profile_id: userId,
            qualification: data.qualification,
            institution_name: data.instituteName,
            grade_type: data.grade_type,
            gpa: data.grade_type === "gpa" ? data.gpa : null,
            obtained_marks: data.grade_type === "percentage" ? data.obtained_marks : null,
            total_marks: data.grade_type === "percentage" ? data.total_marks : null,
            start_date: data.start_date || null,
            end_date: data.end_date || null,
            honors: data.about ?? null,
        }))

        const { error } = await supabase.from("education").insert(payload)
        if (error) return err(error.message, 500)
    }

    return ok({ message: "Academic background saved" }, 200)
}
