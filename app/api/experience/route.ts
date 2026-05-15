import { NextRequest } from "next/server"
import { z } from "zod"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ok, err } from "@/lib/api"

const schema = z.object({
    userId: z.string().uuid(),
    academicGap: z.number().min(0).max(50).optional(),
    hasExperience: z.enum(["yes", "no"]),
    experiences: z.array(z.object({
        name: z.string().optional(),
        organization: z.string().optional(),
        industry: z.string().optional(),
        country: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        responsibility: z.string().optional(),
    })).optional()
}).superRefine((data, ctx) => {
    if (data.hasExperience === "yes" && data.experiences) {
        data.experiences.forEach((exp, i) => {
            if (!exp.name) ctx.addIssue({ path: ["experiences", i, "name"], code: "custom", message: "Job title required" })
            if (!exp.organization) ctx.addIssue({ path: ["experiences", i, "organization"], code: "custom", message: "Organization required" })
            if (!exp.industry) ctx.addIssue({ path: ["experiences", i, "industry"], code: "custom", message: "Industry required" })
            if (!exp.country) ctx.addIssue({ path: ["experiences", i, "country"], code: "custom", message: "Country required" })
            if (!exp.startDate) ctx.addIssue({ path: ["experiences", i, "startDate"], code: "custom", message: "Start date required" })
            if (!exp.endDate) ctx.addIssue({ path: ["experiences", i, "endDate"], code: "custom", message: "End date required" })
            if (!exp.responsibility) ctx.addIssue({ path: ["experiences", i, "responsibility"], code: "custom", message: "Responsibilities required" })
        })
    }
})

export async function POST(req: NextRequest) {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return err(parsed.error.issues[0].message, 400)

    const { userId, academicGap, hasExperience, experiences } = parsed.data

    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return err("Unauthorized", 401)
    if (user.id !== userId) return err("Forbidden", 403)

    // Delete existing
    await supabase.from("work_experience").delete().eq("profile_id", userId)

    if (hasExperience === "yes" && experiences && experiences.length > 0) {
        const payload = experiences.map((exp) => ({
            profile_id: userId,
            timeline_gap_years: academicGap,
            title: exp.name,
            organization_name: exp.organization,
            industry_sector: exp.industry,
            country: exp.country,
            start_date: exp.startDate,
            end_date: exp.endDate,
            key_responsibilities: exp.responsibility,
        }))

        const { error } = await supabase.from("work_experience").insert(payload)

        if (error) return err(error.message, 500)
    }

    return ok({ message: "Experience saved" }, 201)
}
