import { createHash } from "node:crypto"

const BUCKET = "student-admission"

function getExtension(fileName) {
    const index = fileName.lastIndexOf(".")
    if (index === -1) {
        return ""
    }
    return fileName.slice(index).toLowerCase()
}

function guessContentType(fileName) {
    const ext = getExtension(fileName)
    const map = {
        ".pdf": "application/pdf",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".txt": "text/plain",
        ".csv": "text/csv",
    }
    return map[ext] ?? "application/octet-stream"
}

export async function downloadKnackAsset(knackUrl) {
    const response = await fetch(knackUrl, { redirect: "follow" })
    if (!response.ok) {
        throw new Error(`Knack download failed (${response.status}) for ${knackUrl}`)
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    const fileName = decodeURIComponent(knackUrl.split("/").pop() ?? "document")
    const contentType = response.headers.get("content-type") ?? guessContentType(fileName)

    return { buffer, fileName, contentType }
}

export async function uploadDocumentToStorage(supabase, supabaseUrl, {
    profileId,
    documentTypeId,
    recordId,
    knackUrl,
    dryRun = false,
}) {
    if (!knackUrl) {
        return null
    }

    if (dryRun) {
        return knackUrl
    }

    const { buffer, fileName, contentType } = await downloadKnackAsset(knackUrl)
    const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 16)
    const extension = getExtension(fileName)
    const objectPath = `${profileId}/${documentTypeId}/migrated/${recordId}-${hash}${extension}`

    const { error } = await supabase.storage.from(BUCKET).upload(objectPath, buffer, {
        upsert: true,
        contentType,
    })

    if (error) {
        throw new Error(`Storage upload failed: ${error.message}`)
    }

    return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${objectPath}`
}
