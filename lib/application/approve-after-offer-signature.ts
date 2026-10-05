import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

export async function approveApplicationAfterOfferSignature(
    writeClient: SupabaseClient<Database>,
    params: {
        applicationId: string
        reviewedByProfileId: string
    }
): Promise<{ updated: boolean }> {
    const { data: application, error: fetchError } = await writeClient
        .from("application")
        .select("id, status")
        .eq("id", params.applicationId)
        .maybeSingle()

    if (fetchError || !application) {
        console.error("[approveApplicationAfterOfferSignature] fetch:", fetchError?.message)
        return { updated: false }
    }

    if (application.status === "APPROVED") {
        return { updated: false }
    }

    if (application.status !== "PENDING") {
        return { updated: false }
    }

    const now = new Date().toISOString()

    const { error: reviewError } = await writeClient.from("application_review").insert({
        application_id: params.applicationId,
        status: "APPROVED",
        feedback: null,
        reviewed_by_profile_id: params.reviewedByProfileId,
        updated_at: now,
    })

    if (reviewError) {
        console.error("[approveApplicationAfterOfferSignature] review insert:", reviewError.message)
        return { updated: false }
    }

    const { error: updateError } = await writeClient
        .from("application")
        .update({
            status: "APPROVED",
            updated_at: now,
        })
        .eq("id", params.applicationId)

    if (updateError) {
        console.error("[approveApplicationAfterOfferSignature] application update:", updateError.message)
        return { updated: false }
    }

    return { updated: true }
}
