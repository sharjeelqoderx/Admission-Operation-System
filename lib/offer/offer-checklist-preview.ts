import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { evaluateAdmissionRequirements } from "@/lib/document-template/admission-requirements-checklist"
import { mapTemplateRow } from "@/lib/document-template/server"
import { fetchAdmissionRequirementsContext } from "@/lib/offer/admission-requirements-context"
import type { OfferTemplateChecklistPreview } from "@/types/schemas/offer"
import type { Database } from "@/types/supabase"

type AppSupabase = SupabaseClient<Database>

export async function buildOfferChecklistPreviewForApplication(
    supabase: AppSupabase,
    applicationId: string,
    profileId: string
): Promise<OfferTemplateChecklistPreview[]> {
    const [{ data: templateRows, error: templateError }, requirementsContext] = await Promise.all([
        supabase
            .from("document_template")
            .select("*")
            .eq("is_deleted", false)
            .order("updated_at", { ascending: false }),
        fetchAdmissionRequirementsContext(supabase, {
            applicationId,
            profileId,
        }),
    ])

    if (templateError) {
        throw new Error(templateError.message)
    }

    return (templateRows ?? []).map((row) => {
        const template = mapTemplateRow(row)
        const evaluations = evaluateAdmissionRequirements(requirementsContext, {
            itemIds: template.checklist_items,
            locale: "en",
        })

        const fulfilledCount = evaluations.filter((item) => item.fulfilled).length

        return {
            template_id: template.id,
            total_count: evaluations.length,
            fulfilled_count: fulfilledCount,
            items: evaluations.map((item) => ({
                id: item.id,
                label: item.label,
                fulfilled: item.fulfilled,
            })),
        }
    })
}
