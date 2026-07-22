import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import type { ApplicationProfileRole } from "@/types/schemas/application"
import { assertCanResubmitApplication } from "@/lib/application/review-access"
import { recordApplicationResubmit } from "@/lib/application/review-meta"

type ApplicationResubmitRow = {
    id: string
    status: string
    profile_id: string
    submitted_by_profile_id: string | null
}

export async function linkApplicationDocuments(
    supabase: SupabaseClient<Database>,
    applicationId: string,
    documentIds: string[]
) {
    const { error: deleteError } = await supabase
        .from("application_document")
        .delete()
        .eq("application_id", applicationId)

    if (deleteError) {
        throw deleteError
    }

    if (documentIds.length === 0) {
        return
    }

    const { error: insertError } = await supabase.from("application_document").insert(
        documentIds.map((documentId) => ({
            application_id: applicationId,
            document_id: documentId,
        }))
    )

    if (insertError) {
        throw insertError
    }
}

export async function resubmitApplicationById(
    supabase: SupabaseClient<Database>,
    params: {
        applicationId: string
        userId: string
        role: ApplicationProfileRole
        documentIds: string[]
    }
): Promise<
    | { application: ApplicationResubmitRow & Record<string, unknown> }
    | { error: "not_found" | "forbidden" | "invalid_status" }
> {
    const { data: application, error } = await supabase
        .from("application")
        .select("id, status, profile_id, submitted_by_profile_id")
        .eq("id", params.applicationId)
        .maybeSingle()

    if (error || !application) {
        return { error: "not_found" }
    }

    const canResubmit = await assertCanResubmitApplication(
        supabase,
        params.userId,
        application,
        params.role
    )

    if (!canResubmit) {
        return { error: "forbidden" }
    }

    await linkApplicationDocuments(supabase, params.applicationId, params.documentIds)

    await recordApplicationResubmit(supabase, {
        applicationId: params.applicationId,
        reviewedByProfileId: params.userId,
    })

    const { data: updatedApplication, error: fetchError } = await supabase
        .from("application")
        .select("*")
        .eq("id", params.applicationId)
        .single()

    if (fetchError || !updatedApplication) {
        return { error: "not_found" }
    }

    return { application: updatedApplication }
}
