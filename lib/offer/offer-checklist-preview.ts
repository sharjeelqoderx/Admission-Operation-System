import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { evaluateAdmissionRequirements } from "@/lib/document-template/admission-requirements-checklist"
import {
    fetchCourseSummaryById,
    resolveApplicationCourseId,
} from "@/lib/document-template/program-assignment"
import { fetchDocumentTemplateForCourseId } from "@/lib/document-template/server"
import { fetchAdmissionRequirementsContext } from "@/lib/offer/admission-requirements-context"
import type { OfferChecklistPreviewResponse } from "@/types/schemas/offer"
import type { Database } from "@/types/supabase"

type AppSupabase = SupabaseClient<Database>

export async function buildOfferChecklistPreviewForApplication(
    supabase: AppSupabase,
    applicationId: string,
    profileId: string
): Promise<OfferChecklistPreviewResponse["data"]> {
    const [courseId, requirementsContext] = await Promise.all([
        resolveApplicationCourseId(supabase, applicationId),
        fetchAdmissionRequirementsContext(supabase, {
            applicationId,
            profileId,
        }),
    ])

    if (!courseId) {
        return {
            course_id: null,
            course_label: null,
            program_id: null,
            program_label: null,
            template: null,
        }
    }

    const [courseSummary, template] = await Promise.all([
        fetchCourseSummaryById(supabase, courseId),
        fetchDocumentTemplateForCourseId(supabase, courseId),
    ])

    if (!template) {
        return {
            course_id: courseId,
            course_label: courseSummary?.label ?? null,
            program_id: courseId,
            program_label: courseSummary?.label ?? null,
            template: null,
        }
    }

    const evaluations = evaluateAdmissionRequirements(requirementsContext, {
        itemIds: template.checklist_items,
        locale: "en",
    })

    const fulfilledCount = evaluations.filter((item) => item.fulfilled).length

    return {
        course_id: courseId,
        course_label: courseSummary?.label ?? null,
        program_id: courseId,
        program_label: courseSummary?.label ?? null,
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
