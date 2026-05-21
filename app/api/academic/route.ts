import { NextRequest } from "next/server"
import { z } from "zod"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ok, err } from "@/lib/api"

const schema = z.object({
    userId: z.string().uuid(),
    academics: z.array(z.object({
        degree_id: z.string().uuid("Invalid degree"),
        instituteName: z.string().min(2, "Institute name required"),
        obtained_marks: z.number().min(0),
        total_marks: z.number().min(0),
        start_date: z.string().optional(),
        end_date: z.string().optional(),
        about: z.string().optional(),
    }))
})

export async function POST(req: NextRequest) {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return err(parsed.error.issues[0].message, 400)

    const { userId, academics } = parsed.data

    // Server-side duplicate degree_id check
    const degreeIds = academics.map(a => a.degree_id)
    if (new Set(degreeIds).size !== degreeIds.length) {
        return err("Duplicate degree selected. Each degree can only be added once.", 400)
    }

    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return err("Unauthorized", 401)
    if (user.id !== userId) return err("Forbidden", 403)

    await supabase.from("education").delete().eq("profile_id", userId)

    if (academics.length > 0) {
        const payload = academics.map(data => ({
            profile_id: userId,
            degree_id: data.degree_id,
            institution_name: data.instituteName,
            obtained_marks: data.obtained_marks,
            total_marks: data.total_marks,
            start_date: data.start_date || null,
            end_date: data.end_date || null,
            honors: data.about ?? null,
        }))

        const { error } = await supabase.from("education").insert(payload)
        if (error) return err(error.message, 500)
    }

    return ok({ message: "Academic background saved" }, 200)
}
