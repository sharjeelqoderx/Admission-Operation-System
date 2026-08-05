import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { evaluateAdmissionRequirements } from "@/lib/document-template/admission-requirements-checklist"
import {
    fetchDocumentTemplateForProgramId,
    fetchProgramSummaryById,
    resolveApplicationProgramId,
} from "@/lib/document-template/program-assignment"
import { fetchAdmissionRequirementsContext } from "@/lib/offer/admission-requirements-context"
import type { OfferChecklistPreviewResponse } from "@/types/schemas/offer"
import type { Database } from "@/types/supabase"

type AppSupabase = SupabaseClient<Database>

export async function buildOfferChecklistPreviewForApplication(
    supabase: AppSupabase,
    applicationId: string,
    profileId: string
): Promise<OfferChecklistPreviewResponse["data"]> {
    const [programId, requirementsContext] = await Promise.all([
        resolveApplicationProgramId(supabase, applicationId),
        fetchAdmissionRequirementsContext(supabase, {
            applicationId,
            profileId,
        }),
    ])

    if (!programId) {
        return {
            program_id: null,
            program_label: null,
            template: null,
        }
    }

    const [programSummary, template] = await Promise.all([
        fetchProgramSummaryById(supabase, programId),
        fetchDocumentTemplateForProgramId(supabase, programId),
    ])

    if (!template) {
        return {
            program_id: programId,
            program_label: programSummary?.label ?? null,
            template: null,
        }
    }

    const evaluations = evaluateAdmissionRequirements(requirementsContext, {
        itemIds: template.checklist_items,
        locale: "en",
    })

    const fulfilledCount = evaluations.filter((item) => item.fulfilled).length

    return {
        program_id: programId,
        program_label: programSummary?.label ?? null,
        template: {
            template_id: template.id,
            template_title: template.title,
            total_count: evaluations.length,
            fulfilled_count: fulfilledCount,
            items: evaluations.map((item) => ({
                id: item.id,
                label: item.label,
                fulfilled: item.fulfilled,
            })),
        },
    }
}
