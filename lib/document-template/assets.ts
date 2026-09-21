import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { uploadPublicImage } from "@/lib/supabase/upload-public-image"
import type { DocumentTemplateAsset } from "@/types/schemas/document-template"

/** Supabase Storage → Files → Buckets → media → assets/ */
export const DOCUMENT_TEMPLATE_ASSETS_BUCKET = "media"
export const DOCUMENT_TEMPLATE_ASSETS_FOLDER = "assets"

const ALLOWED_IMAGE_TYPES = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
])

const EXTENSION_TO_MIME: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
}

const IMAGE_EXTENSIONS = new Set(Object.keys(EXTENSION_TO_MIME))

export function resolveDocumentTemplateImageMimeType(file: File): string | null {
    const normalizedType = file.type.trim().toLowerCase()
    if (normalizedType && ALLOWED_IMAGE_TYPES.has(normalizedType)) {
        return normalizedType === "image/jpg" ? "image/jpeg" : normalizedType
    }

    const extension = file.name.split(".").pop()?.toLowerCase() ?? ""
    return EXTENSION_TO_MIME[extension] ?? null
}

export function normalizeDocumentTemplateUploadFile(file: File): File | null {
    const resolvedMimeType = resolveDocumentTemplateImageMimeType(file)
    if (!resolvedMimeType) {
        return null
    }

    if (file.type === resolvedMimeType) {
        return file
    }

    return new File([file], file.name, { type: resolvedMimeType })
}

function buildPublicAssetUrl(objectPath: string): string {
    const baseUrl = process.env.SUPABASE_URL
    if (!baseUrl) {
        throw new Error("SUPABASE_URL is not configured")
    }

    return `${baseUrl}/storage/v1/object/public/${DOCUMENT_TEMPLATE_ASSETS_BUCKET}/${objectPath}`
}

function isImageStorageObject(name: string): boolean {
    const extension = name.split(".").pop()?.toLowerCase() ?? ""
    return IMAGE_EXTENSIONS.has(extension)
}

export async function listDocumentTemplateAssets(
    supabase: SupabaseClient
): Promise<DocumentTemplateAsset[]> {
    const { data, error } = await supabase.storage
        .from(DOCUMENT_TEMPLATE_ASSETS_BUCKET)
        .list(DOCUMENT_TEMPLATE_ASSETS_FOLDER, {
            limit: 200,
            offset: 0,
            sortBy: { column: "created_at", order: "desc" },
        })

    if (error) {
        throw new Error(error.message)
    }

    return (data ?? [])
        .filter((entry) => entry.name && !entry.name.startsWith(".") && isImageStorageObject(entry.name))
        .map((entry) => {
            const path = `${DOCUMENT_TEMPLATE_ASSETS_FOLDER}/${entry.name}`
            return {
                name: entry.name,
                path,
                url: buildPublicAssetUrl(path),
                created_at: entry.created_at ?? null,
            }
        })
}

export async function uploadDocumentTemplateAsset(
    supabase: SupabaseClient,
    file: File
): Promise<DocumentTemplateAsset> {
    const uploadFile = normalizeDocumentTemplateUploadFile(file)
    if (!uploadFile) {
        throw new Error("Only JPEG, PNG, WebP, and GIF images are allowed")
    }

    const { objectPath, publicUrl } = await uploadPublicImage({
        supabase,
        bucket: DOCUMENT_TEMPLATE_ASSETS_BUCKET,
        userId: DOCUMENT_TEMPLATE_ASSETS_FOLDER,
        file: uploadFile,
    })

    return {
        name: objectPath.split("/").pop() ?? uploadFile.name,
        path: objectPath,
        url: publicUrl,
        created_at: new Date().toISOString(),
    }
}
