import { NextRequest } from "next/server"
import { z } from "zod"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ok, err } from "@/lib/api"

const schema = z.object({
    userId: z.string().uuid(),
    academics: z.array(z.object({
        qualification: z.string().min(1, "Qualification required"),
        instituteName: z.string().min(2, "Institute name required"),
        gpa: z.number().min(0).max(4),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        about: z.string().optional(),
    }))
})

export async function POST(req: NextRequest) {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return err(parsed.error.issues[0].message, 400)

    const { userId, academics } = parsed.data

    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return err("Unauthorized", 401)
    if (user.id !== userId) return err("Forbidden", 403)

    // First delete existing records to replace them
    await supabase.from("education").delete().eq("profile_id", userId)

    if (academics.length > 0) {
        const payload = academics.map(data => ({
            profile_id: userId,
            qualification: data.qualification,
            institution_name: data.instituteName,
            cumulative_gpa: String(data.gpa),
            honors: data.about,
            start_date: data.startDate || null,
            end_date: data.endDate || null,
        }))

        const { error } = await supabase.from("education").insert(payload)

        if (error) return err(error.message, 500)
    }

    return ok({ message: "Academic background saved" }, 200)
}
