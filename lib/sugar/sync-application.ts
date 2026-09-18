import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import { createSupabaseServiceClient } from "@/lib/supabase/server"
import { isSugarIntegrationConfigured } from "@/lib/sugar/config"
import { createSugarLogicInteraction, getSugarAccessToken } from "@/lib/sugar/client"
import { loadSugarApplicationContext } from "@/lib/sugar/load-application-context"
import { mapApplicationToSugarPayload } from "@/lib/sugar/map-logic-interaction-payload"

export type SugarSyncResult =
    | { synced: true; sugarLogicInteractionId: string }
    | { synced: false; reason: "not_configured" | "already_synced" | "missing_context" | "error"; message?: string }

export async function syncApplicationToSugar(
    applicationId: string,
    supabase?: SupabaseClient<Database>
): Promise<SugarSyncResult> {
    if (!isSugarIntegrationConfigured()) {
        return { synced: false, reason: "not_configured" }
    }

    const dataClient = supabase ?? createSupabaseServiceClient()
    const serviceClient = createSupabaseServiceClient()

    const { data: applicationRow, error: applicationError } = await dataClient
        .from("application")
        .select("id, sugar_logic_interaction_id")
        .eq("id", applicationId)
        .maybeSingle()

    if (applicationError || !applicationRow) {
        return {
            synced: false,
            reason: "missing_context",
            message: applicationError?.message ?? "Application not found",
        }
    }

    if (applicationRow.sugar_logic_interaction_id) {
        return { synced: false, reason: "already_synced" }
    }

    const context = await loadSugarApplicationContext(dataClient, applicationId)
    if (!context) {
        return { synced: false, reason: "missing_context" }
    }

    try {
        const accessToken = await getSugarAccessToken(serviceClient)
        const payload = mapApplicationToSugarPayload(context)
        const sugarLogicInteractionId = await createSugarLogicInteraction(accessToken, payload)

        const { error: updateError } = await dataClient
            .from("application")
            .update({ sugar_logic_interaction_id: sugarLogicInteractionId })
            .eq("id", applicationId)

        if (updateError) {
            throw new Error(updateError.message)
        }

        return { synced: true, sugarLogicInteractionId }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown Sugar sync error"
        console.error(`Sugar sync failed for application ${applicationId}:`, error)
        return { synced: false, reason: "error", message }
    }
}
