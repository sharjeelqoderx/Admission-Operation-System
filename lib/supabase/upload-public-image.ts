import "server-only"
import { createHash } from "crypto"
import type { SupabaseClient } from "@supabase/supabase-js"

type UploadPublicImageArgs = {
    supabase: SupabaseClient
    bucket: string
    userId: string
    file: File
}

function getFileExtension(fileName: string) {
    const idx = fileName.lastIndexOf(".")
    if (idx === -1) return ""
    return fileName.slice(idx + 1).toLowerCase()
}

export async function uploadPublicImage({
    supabase,
    bucket,
    userId,
    file,
}: UploadPublicImageArgs) {
    const arrayBuffer = await file.arrayBuffer()
    const hash = createHash("sha256").update(Buffer.from(arrayBuffer)).digest("hex")
    const ext = getFileExtension(file.name)
    const safeExt = ext ? `.${ext}` : ""

    const objectPath = `${userId}/${hash}${safeExt}`

    const { error } = await supabase.storage
        .from(bucket)
        .upload(objectPath, file, {
            upsert: true,
            contentType: file.type || "application/octet-stream",
        })

    if (error) throw new Error(error.message)

    const baseUrl = process.env.SUPABASE_URL
    if (!baseUrl) throw new Error("SUPABASE_URL is not configured")

    const publicUrl = `${baseUrl}/storage/v1/object/public/${bucket}/${objectPath}`
    return { objectPath, publicUrl }
}

