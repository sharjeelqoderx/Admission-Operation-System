import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ok, err } from "@/lib/api"

export async function GET() {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) return err("Unauthorized", 401)

    const { data: profile } = await supabase
        .from("profile")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()

    const { data: student } = await supabase
        .from("student")
        .select("*")
        .eq("profile_id", user.id)
        .maybeSingle()

    const { data: academic } = await supabase
        .from("education")
        .select("*")
        .eq("profile_id", user.id)
        .maybeSingle()

    const { data: experience } = await supabase
        .from("work_experience")
        .select("*")
        .eq("profile_id", user.id)
        .maybeSingle()

    return ok({
        id: user.id,
        email: profile?.email ?? user.email ?? "",
        fullName: profile?.name ?? user.user_metadata?.full_name ?? "User",
        role: profile?.role ?? "STUDENT",
        profile: {
            dateOfBirth: profile?.date_of_birth ?? "",
            gender: profile?.gender ?? "",
            country: student?.country ?? "",
            nationality: student?.nationality ?? "",
            guardianEmail: student?.guardian_email ?? "",
            guardianPhone: student?.guardian_phone ?? "",
        },
        academic: academic ? {
            highestDegree: academic.qualification ?? "",
            instituteName: academic.institution_name ?? "",
            gpa: academic.cumulative_gpa ? String(academic.cumulative_gpa) : "",
            desiredProgram: "",
            campus: "",
            englishTest: "",
            about: academic.honors ?? "",
        } : null,
        experience: experience ? {
            academicGap: experience.timeline_gap_years ? String(experience.timeline_gap_years) : "",
            hasExperience: "yes" as const,
            jobTitle: experience.title ?? "",
            organization: experience.organization_name ?? "",
            industry: experience.industry_sector ?? "",
            country: experience.country ?? "",
            startDate: experience.start_date ?? "",
            endDate: experience.end_date ?? "",
            responsibilities: experience.key_responsibilities ?? "",
        } : null,
    })
}
