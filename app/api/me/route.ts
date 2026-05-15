import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ok, err } from "@/lib/api"

export async function GET() {
    try {
        const supabase = await createSupabaseServerClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) return err("Unauthorized", 401)

        const { data: profile } = await supabase
            .from("profile")
            .select("*")
            .eq("id", user.id)
            .maybeSingle()

        const role = profile?.role ?? "STUDENT"

        let extraData: any = {}

        if (role === "STUDENT") {
            const { data: student } = await supabase
                .from("student")
                .select("*")
                .eq("profile_id", user.id)
                .maybeSingle()
            extraData = student ?? {}
        } else if (role === "AGENT") {
            const { data: agent } = await supabase
                .from("agent")
                .select("*")
                .eq("profile_id", user.id)
                .maybeSingle()
            extraData = agent ?? {}
        } else if (role === "UNIVERSITY") {
            const { data: university } = await supabase
                .from("university")
                .select("*")
                .eq("profile_id", user.id)
                .maybeSingle()
            extraData = university ?? {}
        }

        const { data: academics } = await supabase
            .from("education")
            .select("*")
            .eq("profile_id", user.id)

        const { data: experiences } = await supabase
            .from("work_experience")
            .select("*")
            .eq("profile_id", user.id)

        return ok({
            id: user.id,
            email: profile?.email ?? user.email ?? "",
            fullName: profile?.name ?? user.user_metadata?.full_name ?? "User",
            phone: profile?.phone ?? "",
            avatarUrl: profile?.avatar_url ?? "",
            role,
            profile: {
                dateOfBirth: profile?.date_of_birth ?? "",
                gender: profile?.gender ?? "",
                country: extraData.country ?? "",
                nationality: extraData.nationality ?? "",
                guardianEmail: extraData.guardian_email ?? "",
                guardianPhone: extraData.guardian_phone ?? "",
                ...extraData
            },
            academic: academics && academics.length > 0 ? academics.map(academic => ({
                highestDegree: academic.qualification ?? "",
                instituteName: academic.institution_name ?? "",
                gpa: academic.cumulative_gpa ? String(academic.cumulative_gpa) : "",
                startDate: academic.start_date ?? "",
                endDate: academic.end_date ?? "",
                about: academic.honors ?? "",
            })) : null,
            experience: experiences && experiences.length > 0 ? {
                academicGap: experiences[0].timeline_gap_years ? String(experiences[0].timeline_gap_years) : "",
                hasExperience: "yes" as const,
                entries: experiences.map(experience => ({
                    jobTitle: experience.title ?? "",
                    organization: experience.organization_name ?? "",
                    industry: experience.industry_sector ?? "",
                    country: experience.country ?? "",
                    startDate: experience.start_date ?? "",
                    endDate: experience.end_date ?? "",
                    responsibilities: experience.key_responsibilities ?? "",
                }))
            } : null,
        })
    } catch (e) {
        console.log('error -> ', e)
        return err("Unauthorized", 401)
    }
}
