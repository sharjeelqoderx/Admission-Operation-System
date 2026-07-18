import type { SupabaseClient } from "@supabase/supabase-js"
import { canAgentAccessApplication } from "@/lib/api/agent-applications"
import type {
    ApplicationDetail,
    ApplicationDetailOfferLetter,
    ApplicationProfileRole,
} from "@/types/schemas/application"
import type { Database } from "@/types/supabase"
import { Role } from "@/types/enums/role"

const APPLICATION_DETAIL_SELECT = `
    *,
    student:profile_id ( id, first_name, last_name, avatar_url, email, date_of_birth, gender ),
    course:course_id (
        id,
        name,
        deadline_date,
        degree:degree_id (
            id,
            name,
            fees,
            intake_date,
            duration,
            location,
            language_of_study,
            study_mode
        )
    ),
    university:university_id ( id, first_name, last_name ),
    agent:submitted_by_profile_id ( id, first_name, last_name ),
    documents:application_document (
        document:document_id (
            id,
            created_at,
            document_type:document_type_id ( id, name ),
            document_files ( file_url, type ),
            document_review ( status, feedback )
        )
    )
`

type ApplicationDetailQueryRow = Omit<ApplicationDetail, "offer_letter">

async function fetchOfferForApplication(
    supabase: SupabaseClient<Database>,
    applicationId: string
): Promise<ApplicationDetailOfferLetter | null> {
    const { data: offer, error } = await supabase
        .from("offer_letter")
        .select("status")
        .eq("application_id", applicationId)
        .maybeSingle()

    if (error) {
        throw error
    }

    return offer
}

function mapApplicationDetail(
    application: ApplicationDetailQueryRow,
    offerLetter: ApplicationDetailOfferLetter | null
): ApplicationDetail {
    return {
        ...application,
        offer_letter: offerLetter,
        documents: application.documents ?? [],
    }
}

export async function fetchApplicationDetail(
    supabase: SupabaseClient<Database>,
    options: {
        userId: string
        role: ApplicationProfileRole
        applicationId: string
        scope?: "all"
    }
): Promise<ApplicationDetail | { error: string }> {
    const { userId, role, applicationId, scope } = options

    if (scope === "all" && role === Role.STUDENT) {
        return { error: "Forbidden" }
    }

    const { data: application, error } = await supabase
        .from("application")
        .select(APPLICATION_DETAIL_SELECT)
        .eq("id", applicationId)
        .single()

    if (error || !application) {
        console.error("fetchApplicationDetail query error:", error)
        return { error: "Application not found" }
    }

    const row = application as unknown as ApplicationDetailQueryRow

    if (role === Role.STUDENT && row.profile_id !== userId) {
        return { error: "Application not found" }
    }

    if (role === Role.AGENT && scope !== "all") {
        const allowed = await canAgentAccessApplication(supabase, userId, {
            profile_id: row.profile_id,
            submitted_by_profile_id: row.submitted_by_profile_id,
        })

        if (!allowed) {
            return { error: "Application not found" }
        }
    }

    if (role === Role.ADMIN && scope !== "all" && row.university_id !== userId) {
        return { error: "Application not found" }
    }

    const offerLetter = await fetchOfferForApplication(supabase, applicationId)

    return mapApplicationDetail(row, offerLetter)
}
