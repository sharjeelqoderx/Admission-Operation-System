import { NextRequest } from "next/server"
import { z } from "zod"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ok, err } from "@/lib/api"

const schema = z.object({
    userId: z.string().uuid(),
    qualification: z.string().min(1, "Qualification required"),
    instituteName: z.string().min(2, "Institute name required"),
    gpa: z.number().min(0).max(4),
    desiredProgram: z.string().min(1),
    campus: z.string().min(1),
    englishTest: z.string().min(1),
    about: z.string().min(10).max(500),
})

export async function POST(req: NextRequest) {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return err(parsed.error.issues[0].message, 400)

    const { userId, ...data } = parsed.data

    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return err("Unauthorized", 401)
    if (user.id !== userId) return err("Forbidden", 403)

    const payload = {
        profile_id: userId,
        qualification: data.qualification,
        institution_name: data.instituteName,
        cumulative_gpa: String(data.gpa),
        honors: data.about,
    }

    const { data: existing } = await supabase
        .from("education")
        .select("id")
        .eq("profile_id", userId)
        .maybeSingle()

    const { error } = existing
        ? await supabase.from("education").update(payload).eq("id", existing.id)
        : await supabase.from("education").insert(payload)

    if (error) return err(error.message, 500)

    return ok({ message: "Academic background saved" }, 200)
}
