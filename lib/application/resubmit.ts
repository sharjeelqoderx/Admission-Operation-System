import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import type { ApplicationProfileRole } from "@/types/schemas/application"
import { createSupabaseServiceClient } from "@/lib/supabase/server"
import { assertCanResubmitApplication } from "@/lib/application/review-access"
import { recordApplicationResubmit } from "@/lib/application/review-meta"

type ApplicationResubmitRow = {
    id: string
    status: string
    profile_id: string
    submitted_by_profile_id: string | null
}

/**
 * Replaces an application's document links. Callers must already have authorised the
 * user for this application. Writes use the service client because `application_document`
 * has no INSERT/DELETE RLS policy for agents or students; only documents owned by the
 * application's student are linked.
 */
export async function linkApplicationDocuments(
    _supabase: SupabaseClient<Database>,
    applicationId: string,
    documentIds: string[],
    studentProfileId: string
) {
    const db = createSupabaseServiceClient()

    const { error: deleteError } = await db
        .from("application_document")
        .delete()
        .eq("application_id", applicationId)

    if (deleteError) {
        throw deleteError
    }

    if (documentIds.length === 0) {
        return
    }

    const { data: ownedDocuments, error: ownedError } = await db
        .from("document")
        .select("id")
        .in("id", documentIds)
        .eq("profile_id", studentProfileId)

    if (ownedError) {
        throw ownedError
    }

    const linkableIds = (ownedDocuments ?? []).map((doc) => doc.id)
    if (linkableIds.length === 0) {
        return
    }

    const { error: insertError } = await db.from("application_document").insert(
        linkableIds.map((documentId) => ({
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

    await linkApplicationDocuments(
        supabase,
        params.applicationId,
        params.documentIds,
        application.profile_id
    )

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
