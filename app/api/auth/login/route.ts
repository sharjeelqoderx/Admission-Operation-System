import { NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ok, err } from "@/lib/api"
import { loginSchema } from "@/types/schemas/auth"

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const parsed = loginSchema.safeParse(body)
        if (!parsed.success) return err(parsed.error.issues[0].message, 400)

        const { email, password } = parsed.data
        const normalizedEmail = email.toLowerCase()
        const supabase = await createSupabaseServerClient()

        const { data, error } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
        })

        if (error) {
            if (error.message.toLowerCase().includes("email not confirmed")) {
                const { error: resendError } = await supabase.auth.resend({
                    type: "signup",
                    email: normalizedEmail,
                })
                if (resendError) return err("Failed to resend verification", 500)
                return err("Email not verified. New OTP sent.", 403)
            }

            if (error.message.toLowerCase().includes("invalid login credentials")) {
                return err("Invalid email or password", 401)
            }

            return err(error.message, 401)
        }

        const { data: profile } = await supabase
            .from("profile")
            .select("id, email, name, role, date_of_birth, gender")
            .eq("id", data.user.id)
            .maybeSingle()

        const { data: student } = await supabase
            .from("student")
            .select("country, nationality, guardian_email, guardian_phone")
            .eq("profile_id", data.user.id)
            .maybeSingle()

        const { data: academic } = await supabase
            .from("education")
            .select("qualification, institution_name, cumulative_gpa")
            .eq("profile_id", data.user.id)
            .maybeSingle()

        const { data: experience } = await supabase
            .from("work_experience")
            .select("timeline_gap_years, title, organization_name, industry_sector, country, start_date, end_date, key_responsibilities")
            .eq("profile_id", data.user.id)
            .maybeSingle()

        return ok({
            id: data.user.id,
            email: profile?.email ?? data.user.email ?? "",
            fullName: profile?.name ?? data.user.user_metadata?.full_name ?? "",
            role: profile?.role ?? (data.user.user_metadata?.role ?? "STUDENT"),
            profile: {
                dateOfBirth: profile?.date_of_birth ?? "",
                gender: profile?.gender?.toLowerCase?.() ?? "",
                country: student?.country ?? "",
                nationality: student?.nationality ?? "",
                guardianEmail: student?.guardian_email ?? "",
                guardianPhone: student?.guardian_phone ?? "",
            }
                ,
            academic: academic
                ? {
                    highestDegree: academic.qualification ?? "",
                    instituteName: academic.institution_name ?? "",
                    gpa: academic.cumulative_gpa ?? "",
                    desiredProgram: "",
                    campus: "",
                    englishTest: "",
                    about: "",
                }
                : null,
            experience: experience
                ? {
                    academicGap: experience.timeline_gap_years ? String(experience.timeline_gap_years) : "",
                    hasExperience: "yes" as const,
                    jobTitle: experience.title ?? "",
                    organization: experience.organization_name ?? "",
                    industry: experience.industry_sector ?? "",
                    country: experience.country ?? "",
                    startDate: experience.start_date ?? "",
                    endDate: experience.end_date ?? "",
                    responsibilities: experience.key_responsibilities ?? "",
                }
                : null,
        })
    } catch {
        return err("Internal server error", 500)
    }
}