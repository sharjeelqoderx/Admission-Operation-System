import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import { extractTemplateVariables, renderTemplateHtml } from "@/lib/document-template/variables"
import { normalizeTemplateLocale } from "@/lib/document-template/locale"
import { parseDocumentTemplateDates } from "@/lib/document-template/date-variables"
import {
    buildOfferTemplateVariables,
    type OfferApplicationContext,
} from "@/lib/offer/build-offer-variables"
import { fetchAdmissionRequirementsContext } from "@/lib/offer/admission-requirements-context"
import {
    type AdmissionRequirementId,
    type ChecklistProofs,
} from "@/lib/document-template/checklist-items"
import { resolveOfferChecklistItems, resolveTemplateChecklistItems } from "@/lib/document-template/resolve-checklist-items"
import { withProfileDisplayName } from "@/lib/utils/profile"

type AppSupabase = SupabaseClient<Database>

type ProfileRelation = {
    first_name?: string | null
    last_name?: string | null
    title?: string | null
    date_of_birth?: string | null
    signature?: string | null
} | null

function pickProfile(
    value: ProfileRelation | ProfileRelation[] | null | undefined
): ProfileRelation {
    return Array.isArray(value) ? value[0] ?? null : value ?? null
}

function formatIssueDate(value: string, locale: "de" | "en"): string {
    return new Date(value).toLocaleDateString(locale === "de" ? "de-DE" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })
}

function parseChecklistProofs(value: unknown): ChecklistProofs | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null
    }

    return value as ChecklistProofs
}

export async function renderOfferBodyHtml(
    supabase: AppSupabase,
    params: {
        bodyHtml?: string | null
        documentTemplateId?: string | null
        createdAt?: string | null
        checklistItems?: unknown
        checklistProofs?: unknown
        application: {
            id: string
            application_no?: string | null
            profile_id: string
            student?: ProfileRelation | ProfileRelation[] | null
            course?: OfferApplicationContext["course"]
            university?: ProfileRelation | ProfileRelation[] | null
        }
    }
): Promise<string | null> {
    let sourceHtml = params.bodyHtml?.trim() || null
    let templateChecklistItems: AdmissionRequirementId[] = []
    let templateChecklistProfile: string | null = null
    let templateLocale: "de" | "en" = "en"
    let templateDates = parseDocumentTemplateDates(null)

    if (params.documentTemplateId) {
        const { data: templateRow } = await supabase
            .from("document_template")
            .select("body_html, checklist_items, checklist_profile, locale, template_dates")
            .eq("id", params.documentTemplateId)
            .eq("is_deleted", false)
            .maybeSingle()

        if (templateRow?.body_html?.trim()) {
            sourceHtml = templateRow.body_html
        }

        templateLocale = normalizeTemplateLocale(templateRow?.locale)
        templateDates = parseDocumentTemplateDates(templateRow?.template_dates)

        templateChecklistProfile =
            typeof templateRow?.checklist_profile === "string"
                ? templateRow.checklist_profile
                : null

        templateChecklistItems = resolveTemplateChecklistItems({
            checklistItems: templateRow?.checklist_items,
            checklistProfile: templateChecklistProfile,
        })
    }

    if (!sourceHtml) {
        return null
    }

    const shouldRender =
        Boolean(params.documentTemplateId) ||
        extractTemplateVariables(sourceHtml).length > 0 ||
        /\{\{\s*[\w.]+\s*\}\}/.test(sourceHtml)

    if (!shouldRender) {
        return sourceHtml
    }

    const studentProfile = pickProfile(params.application.student)
    const student = withProfileDisplayName(studentProfile)
    const university = withProfileDisplayName(pickProfile(params.application.university))

    const { data: studentRecord } = await supabase
        .from("student")
        .select("street_1, street_2, street_3, post_code, city, state, country, address, zip_code")
        .eq("profile_id", params.application.profile_id)
        .maybeSingle()

    const requirementsContext = await fetchAdmissionRequirementsContext(supabase, {
        applicationId: params.application.id,
        profileId: params.application.profile_id,
    })

    const resolvedChecklistItems = resolveOfferChecklistItems({
        offerChecklistItems: params.checklistItems,
        templateChecklistItems,
        templateChecklistProfile,
    })

    const variables = buildOfferTemplateVariables(
        {
            application_no: params.application.application_no,
            student: student
                ? {
                      ...student,
                      title: studentProfile?.title ?? null,
                      date_of_birth: studentProfile?.date_of_birth ?? null,
                      street_1: studentRecord?.street_1 ?? null,
                      street_2: studentRecord?.street_2 ?? null,
                      street_3: studentRecord?.street_3 ?? null,
                      post_code: studentRecord?.post_code ?? null,
                      address: studentRecord?.address ?? null,
                      city: studentRecord?.city ?? null,
                      state: studentRecord?.state ?? null,
                      country: studentRecord?.country ?? null,
                      zip_code: studentRecord?.zip_code ?? null,
                  }
                : null,
            course: params.application.course,
            university,
        },
        requirementsContext,
        {
            itemIds: resolvedChecklistItems,
            proofs: parseChecklistProofs(params.checklistProofs),
        },
        {
            locale: templateLocale,
            issueDate: params.createdAt,
            templateDates,
        }
    )

    if (params.createdAt) {
        variables.issue_date = formatIssueDate(params.createdAt, templateLocale)
    }

    return renderTemplateHtml(sourceHtml, variables)
}
