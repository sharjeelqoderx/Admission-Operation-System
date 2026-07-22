import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { saveDocumentUpload } from "@/lib/supabase/save-document-upload"

type UpsertStudentDocumentArgs = {
    supabase: SupabaseClient
    profileId: string
    uploadedByProfileId: string
    documentTypeId: string
    file: File
    storageSubpath?: string
}

export async function upsertStudentDocument({
    supabase,
    profileId,
    uploadedByProfileId,
    documentTypeId,
    file,
}: UpsertStudentDocumentArgs) {
    const document = await saveDocumentUpload({
        supabase,
        studentProfileId: profileId,
        uploadedByProfileId,
        documentTypeId,
        files: [file],
    })

    const fileUrl =
        (await supabase
            .from("document_files")
            .select("file_url")
            .eq("document_id", document.id)
            .eq("type", "FRONT")
            .maybeSingle()).data?.file_url ?? null

    return { documentId: document.id, publicUrl: fileUrl }
}
