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
    if (!parsed.success) return err(parsed.error.issues[0].message)

    const { userId, ...data } = parsed.data

    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.from("academic_background").insert({
        user_id: userId,
        qualification: data.qualification,
        institute_name: data.instituteName,
        gpa: data.gpa,
        desired_program: data.desiredProgram,
        campus: data.campus,
        english_test: data.englishTest,
        about: data.about,
    })

    if (error) return err(error.message, 500)

    return ok({ message: "Academic background saved" }, 201)
}
