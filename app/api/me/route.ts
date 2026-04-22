import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ok, err } from "@/lib/api"

export async function GET() {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) return err("Unauthorized", 401)

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single()

    const { data: academic } = await supabase
        .from("academic_background")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()

    const { data: experience } = await supabase
        .from("experience")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()

    return ok({
        id: user.id,
        email: profile?.email ?? user.email ?? "",
        fullName: profile?.full_name ?? user.user_metadata?.full_name ?? "User",
        role: profile?.role ?? "Student",
        profile: {
            dateOfBirth: profile?.date_of_birth ?? "",
            gender: profile?.gender ?? "",
            country: profile?.country ?? "",
            nationality: profile?.nationality ?? "",
            guardianEmail: profile?.guardian_email ?? "",
            guardianPhone: profile?.guardian_phone ?? "",
        },
        academic: academic ? {
            highestDegree: academic.qualification ?? "",
            instituteName: academic.institute_name ?? "",
            gpa: academic.gpa ? String(academic.gpa) : "",
            desiredProgram: academic.desired_program ?? "",
            campus: academic.campus ?? "",
            englishTest: academic.english_test ?? "",
            about: academic.about ?? "",
        } : null,
        experience: experience ? {
            academicGap: experience.academic_gap ? String(experience.academic_gap) : "",
            hasExperience: "yes" as const,
            jobTitle: experience.name ?? "",
            organization: experience.organization ?? "",
            industry: experience.industry ?? "",
            country: experience.country ?? "",
            startDate: experience.start_date ?? "",
            endDate: experience.end_date ?? "",
            responsibilities: experience.responsibility ?? "",
        } : null,
    })
}
