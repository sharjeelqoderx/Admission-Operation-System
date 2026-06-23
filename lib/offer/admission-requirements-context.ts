import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import type {
    AdmissionRequirementsContext,
    StudentDocumentSnapshot,
} from "@/lib/document-template/admission-requirements-checklist"

type AppSupabase = SupabaseClient<Database>

type DocumentRow = {
    id: string
    document_type: { code: string | null } | { code: string | null }[] | null
    document_review: { status: string | null }[] | null
    document_files: { id: string }[] | null
}

function mapDocumentRow(row: DocumentRow): StudentDocumentSnapshot {
    const documentType = Array.isArray(row.document_type)
        ? row.document_type[0]
        : row.document_type

    return {
        code: documentType?.code ?? null,
        reviewStatus: row.document_review?.[0]?.status ?? null,
        hasFiles: (row.document_files?.length ?? 0) > 0,
    }
}

export async function fetchAdmissionRequirementsContext(
    supabase: AppSupabase,
    params: { applicationId: string; profileId: string }
): Promise<AdmissionRequirementsContext> {
    const [{ data: paymentRows }, { data: studentRow }, { data: workExperienceRows }, { data: applicationDocuments }, { data: profileDocuments }] =
        await Promise.all([
            supabase
                .from("payment")
                .select("status")
                .eq("application_id", params.applicationId)
                .order("created_at", { ascending: false })
                .limit(1),
            supabase
                .from("student")
                .select("aps_requirement")
                .eq("profile_id", params.profileId)
                .maybeSingle(),
            supabase
                .from("work_experience")
                .select("id")
                .eq("profile_id", params.profileId)
                .limit(1),
            supabase
                .from("application_document")
                .select(`
                    document:document_id (
                        id,
                        document_type:document_type_id ( code ),
                        document_review ( status ),
                        document_files ( id )
                    )
                `)
                .eq("application_id", params.applicationId),
            supabase
                .from("document")
                .select(`
                    id,
                    document_type:document_type_id ( code ),
                    document_review ( status ),
                    document_files ( id )
                `)
                .eq("profile_id", params.profileId),
        ])

    const documentsById = new Map<string, StudentDocumentSnapshot>()

    for (const row of applicationDocuments ?? []) {
        const document = row.document as DocumentRow | DocumentRow[] | null
        const doc = Array.isArray(document) ? document[0] : document
        if (!doc?.id) continue
        documentsById.set(doc.id, mapDocumentRow(doc))
    }

    for (const doc of profileDocuments ?? []) {
        if (!doc.id || documentsById.has(doc.id)) continue
        documentsById.set(doc.id, mapDocumentRow(doc as DocumentRow))
    }

    return {
        paymentStatus: paymentRows?.[0]?.status ?? null,
        apsRequirement: studentRow?.aps_requirement ?? false,
        hasWorkExperience: (workExperienceRows?.length ?? 0) > 0,
        documents: [...documentsById.values()],
    }
}
