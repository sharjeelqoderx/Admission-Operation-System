import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import { extractTemplateVariables, renderTemplateHtml } from "@/lib/document-template/variables"
import {
    buildOfferTemplateVariables,
    type OfferApplicationContext,
} from "@/lib/offer/build-offer-variables"
import { fetchAdmissionRequirementsContext } from "@/lib/offer/admission-requirements-context"
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

function formatIssueDate(value: string): string {
    return new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })
}

export async function renderOfferBodyHtml(
    supabase: AppSupabase,
    params: {
        bodyHtml?: string | null
        documentTemplateId?: string | null
        createdAt?: string | null
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

    if (params.documentTemplateId) {
        const { data: templateRow } = await supabase
            .from("document_template")
            .select("body_html")
            .eq("id", params.documentTemplateId)
            .eq("is_deleted", false)
            .maybeSingle()

        if (templateRow?.body_html?.trim()) {
            sourceHtml = templateRow.body_html
        }
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
        .select("address, city, state, country, zip_code")
        .eq("profile_id", params.application.profile_id)
        .maybeSingle()

    const requirementsContext = await fetchAdmissionRequirementsContext(supabase, {
        applicationId: params.application.id,
        profileId: params.application.profile_id,
    })

    const variables = buildOfferTemplateVariables(
        {
            application_no: params.application.application_no,
            student: student
                ? {
                      ...student,
                      title: studentProfile?.title ?? null,
                      date_of_birth: studentProfile?.date_of_birth ?? null,
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
        requirementsContext
    )

    if (params.createdAt) {
        variables.issue_date = formatIssueDate(params.createdAt)
    }

    return renderTemplateHtml(sourceHtml, variables)
}
