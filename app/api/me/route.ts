import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ok, err } from "@/lib/api"
import { normalizeDateValue } from "@/types/schemas/academic"
import { formatFullName } from "@/lib/utils/profile"
import { isUniversityRole } from "@/lib/auth/university-role"
import { Role } from "@/types/enums/role"

export async function GET() {
    try {
        const supabase = await createSupabaseServerClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) return err("Unauthorized", 401)

        const { data: profile, error: profileError } = await supabase
            .from("profile")
            .select("*")
            .eq("id", user.id)
            .maybeSingle()

        if (profileError) return err(profileError.message, 500)
        if (!profile) return err("Profile not found", 404)

        const role = profile.role

        let extraData: any = {}

        if (role === Role.STUDENT) {
            const { data: student } = await supabase
                .from("student")
                .select("*")
                .eq("profile_id", user.id)
                .maybeSingle()
            extraData = student ?? {}
        } else if (role === Role.AGENT) {
            const { data: agent } = await supabase
                .from("agent")
                .select("*")
                .eq("profile_id", user.id)
                .maybeSingle()
            extraData = agent ?? {}
        } else if (isUniversityRole(role)) {
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

        let agentKyc: {
            registrationCertificateUrl: string | null
            idCardFrontUrl: string | null
            idCardBackUrl: string | null
        } | null = null

        if (role === Role.AGENT) {
            const { data: agentDocuments } = await supabase
                .from("document")
                .select("document_type_id, created_at, document_type:document_type_id(code, name), document_files(file_url, type)")
                .eq("profile_id", user.id)
                .order("created_at", { ascending: true })

            const docs = agentDocuments ?? []

            const latestUrlForCode = (code: string) => {
                let url: string | null = null
                for (const doc of docs) {
                    const docType = doc.document_type as { code?: string | null; name?: string | null } | null
                    if (docType?.code !== code) continue
                    for (const file of doc.document_files ?? []) {
                        url = file.file_url
                    }
                }
                return url
            }

            const legacyFrontUrls: string[] = []
            const legacyBackUrls: string[] = []
            const legacyCnicFrontUrls: string[] = []
            const legacyCnicBackUrls: string[] = []

            for (const doc of docs) {
                const docType = doc.document_type as { code?: string | null; name?: string | null } | null
                const isLegacyCnic =
                    !!doc.document_type_id &&
                    (docType?.code === "CNIC" || docType?.name === "CNIC")

                for (const file of doc.document_files ?? []) {
                    if (isLegacyCnic) {
                        if (file.type === "FRONT") legacyCnicFrontUrls.push(file.file_url)
                        if (file.type === "BACK") legacyCnicBackUrls.push(file.file_url)
                    } else if (!doc.document_type_id) {
                        if (file.type === "FRONT") legacyFrontUrls.push(file.file_url)
                        if (file.type === "BACK") legacyBackUrls.push(file.file_url)
                    }
                }
            }

            agentKyc = {
                registrationCertificateUrl:
                    latestUrlForCode("AGENT_REGISTRATION") ??
                    legacyFrontUrls[0] ??
                    null,
                idCardFrontUrl:
                    latestUrlForCode("AGENT_ID_FRONT") ??
                    legacyCnicFrontUrls.at(-1) ??
                    (legacyFrontUrls.length > 1
                        ? legacyFrontUrls.at(-1)
                        : legacyBackUrls.length > 0
                            ? legacyFrontUrls[0]
                            : null) ??
                    null,
                idCardBackUrl:
                    latestUrlForCode("AGENT_ID_BACK") ??
                    legacyCnicBackUrls.at(-1) ??
                    legacyBackUrls.at(-1) ??
                    null,
            }
        }

        return ok({
            id: user.id,
            email: profile.email ?? user.email ?? "",
            fullName: formatFullName(
                profile.first_name,
                profile.last_name,
                user.user_metadata?.full_name ?? "User"
            ),
            firstName: profile.first_name ?? "",
            lastName: profile.last_name ?? "",
            title: profile.title ?? "",
            phone: profile.phone ?? "",
            avatarUrl: profile.avatar_url ?? "",
            role,
            profile: {
                dateOfBirth: profile.date_of_birth ?? "",
                gender: profile.gender ?? "",
                country: extraData.country ?? "",
                state: extraData.state ?? "",
                city: extraData.city ?? "",
                nationality: extraData.nationality ?? "",
                guardianEmail: extraData.guardian_email ?? "",
                guardianPhone: extraData.guardian_phone ?? "",
                contact_person_first_name: extraData.contact_person_first_name ?? "",
                contact_person_last_name: extraData.contact_person_last_name ?? "",
                ...extraData
            },
            academic: academics && academics.length > 0 ? academics.map(academic => ({
                qualification: academic.qualification ?? "",
                grade_type: academic.grade_type ?? null,
                gpa: academic.gpa != null ? String(academic.gpa) : "",
                instituteName: academic.institution_name ?? "",
                obtained_marks: academic.obtained_marks != null ? String(academic.obtained_marks) : "",
                total_marks: academic.total_marks != null ? String(academic.total_marks) : "",
                start_date: normalizeDateValue(academic.start_date),
                end_date: normalizeDateValue(academic.end_date),
                about: academic.honors ?? "",
            })) : null,
            experience: experiences && experiences.length > 0 ? {
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
            agentKyc,
        })
    } catch (e) {
        console.log('error -> ', e)
        return err("Unauthorized", 401)
    }
}
