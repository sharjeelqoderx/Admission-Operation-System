import { NextRequest } from "next/server"
import { z } from "zod"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ok, err } from "@/lib/api"

const schema = z.object({
    userId: z.string().uuid(),
    academicGap: z.number().min(0).max(50).optional(),
    hasExperience: z.enum(["yes", "no"]),
    name: z.string().optional(),
    organization: z.string().optional(),
    industry: z.string().optional(),
    country: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    responsibility: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.hasExperience === "yes") {
        if (!data.name) ctx.addIssue({ path: ["name"], code: "custom", message: "Job title required" })
        if (!data.organization) ctx.addIssue({ path: ["organization"], code: "custom", message: "Organization required" })
        if (!data.industry) ctx.addIssue({ path: ["industry"], code: "custom", message: "Industry required" })
        if (!data.country) ctx.addIssue({ path: ["country"], code: "custom", message: "Country required" })
        if (!data.startDate) ctx.addIssue({ path: ["startDate"], code: "custom", message: "Start date required" })
        if (!data.endDate) ctx.addIssue({ path: ["endDate"], code: "custom", message: "End date required" })
        if (!data.responsibility) ctx.addIssue({ path: ["responsibility"], code: "custom", message: "Responsibilities required" })
    }
})

export async function POST(req: NextRequest) {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return err(parsed.error.issues[0].message, 400)

    const { userId, academicGap, hasExperience, ...exp } = parsed.data

    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return err("Unauthorized", 401)
    if (user.id !== userId) return err("Forbidden", 403)

    if (hasExperience === "yes") {
        const payload = {
            profile_id: userId,
            timeline_gap_years: academicGap,
            title: exp.name,
            organization_name: exp.organization,
            industry_sector: exp.industry,
            country: exp.country,
            start_date: exp.startDate,
            end_date: exp.endDate,
            key_responsibilities: exp.responsibility,
        }

        const { data: existing } = await supabase
            .from("work_experience")
            .select("id")
            .eq("profile_id", userId)
            .maybeSingle()

        const { error } = existing
            ? await supabase.from("work_experience").update(payload).eq("id", existing.id)
            : await supabase.from("work_experience").insert(payload)

        if (error) return err(error.message, 500)
    }

    return ok({ message: "Experience saved" }, 201)
}
