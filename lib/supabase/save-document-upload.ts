import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { uploadPublicImage } from "@/lib/supabase/upload-public-image"

const BUCKET = "student-admission"

type SaveDocumentUploadInput = {
    supabase: SupabaseClient
    studentProfileId: string
    uploadedByProfileId: string
    documentTypeId: string
    files: File[]
}

async function insertDocumentReview(
    supabase: SupabaseClient,
    documentId: string
) {
    const reviewPayload = {
        document_id: documentId,
        reviewed_by_profile_id: null,
        feedback: null,
    }

    const { error: pendingError } = await supabase.from("document_review").insert({
        ...reviewPayload,
        status: "PENDING",
    })

    if (!pendingError) return

    const isInvalidPendingStatus =
        pendingError.code === "22P02" ||
        /invalid input value for enum doc_status_enum/i.test(pendingError.message ?? "")

    if (!isInvalidPendingStatus) {
        throw new Error(pendingError.message ?? "Failed to create document review")
    }

    const { error: fallbackError } = await supabase.from("document_review").insert({
        ...reviewPayload,
        status: "NEEDS_REVISION",
    })

    if (fallbackError) {
        throw new Error(fallbackError.message ?? "Failed to create document review")
    }
}

export async function saveDocumentUpload({
    supabase,
    studentProfileId,
    uploadedByProfileId,
    documentTypeId,
    files,
}: SaveDocumentUploadInput) {
    const { error: deleteError } = await supabase
        .from("document")
        .delete()
        .eq("profile_id", studentProfileId)
        .eq("document_type_id", documentTypeId)

    if (deleteError) {
        throw new Error(deleteError.message ?? "Failed to replace existing document")
    }

    const { data: document, error: docError } = await supabase
        .from("document")
        .insert({
            profile_id: studentProfileId,
            uploaded_by_profile_id: uploadedByProfileId,
            document_type_id: documentTypeId,
        })
        .select()
        .single()

    if (docError || !document) {
        throw new Error(docError?.message ?? "Failed to create document")
    }

    const filesToInsert: Array<{
        document_id: string
        file_url: string
        type: "FRONT" | "BACK"
    }> = []

    for (let index = 0; index < files.length; index++) {
        const file = files[index]
        const { publicUrl } = await uploadPublicImage({
            supabase,
            bucket: BUCKET,
            userId: `${studentProfileId}/${documentTypeId}`,
            file,
        })

        filesToInsert.push({
            document_id: document.id,
            file_url: publicUrl,
            type: index === 0 ? "FRONT" : "BACK",
        })
    }

    const { error: filesError } = await supabase.from("document_files").insert(filesToInsert)
    if (filesError) {
        throw new Error(filesError.message ?? "Failed to save document files")
    }

    await insertDocumentReview(supabase, document.id)

    return document
}
