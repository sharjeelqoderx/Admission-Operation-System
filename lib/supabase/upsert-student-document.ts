import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { uploadPublicImage } from "@/lib/supabase/upload-public-image"

const STUDENT_ADMISSION_BUCKET = "student-admission"

type UpsertStudentDocumentArgs = {
    supabase: SupabaseClient
    profileId: string
    uploadedByProfileId: string
    documentTypeId: string
    file: File
    storageSubpath: string
}

export async function upsertStudentDocument({
    supabase,
    profileId,
    uploadedByProfileId,
    documentTypeId,
    file,
    storageSubpath,
}: UpsertStudentDocumentArgs) {
    const { publicUrl } = await uploadPublicImage({
        supabase,
        bucket: STUDENT_ADMISSION_BUCKET,
        userId: `${profileId}/${storageSubpath}`,
        file,
    })

    await supabase
        .from("document")
        .delete()
        .eq("profile_id", profileId)
        .eq("document_type_id", documentTypeId)

    const { data: docRecord } = await supabase
        .from("document")
        .insert({
            profile_id: profileId,
            uploaded_by_profile_id: uploadedByProfileId,
            document_type_id: documentTypeId,
        })
        .select()
        .single()

    if (docRecord) {
        await supabase.from("document_files").insert({
            document_id: docRecord.id,
            file_url: publicUrl,
            type: "FRONT",
        })
        await supabase.from("document_review").insert({
            document_id: docRecord.id,
            reviewed_by_profile_id: null,
            status: "PENDING",
            feedback: null,
        })
    }

    return { documentId: docRecord?.id, publicUrl }
}
