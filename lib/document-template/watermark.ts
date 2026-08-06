import {
    DEFAULT_PLACEHOLDER_LOGO_SRC,
    PLACEHOLDER_LOGO_SIZE_PX,
} from "@/lib/document-template/a4-document"

export type DocumentTemplateWatermark = {
    enabled: boolean
    image_url: string | null
    opacity: number
    size_px: number
}

export const DEFAULT_DOCUMENT_TEMPLATE_WATERMARK: DocumentTemplateWatermark = {
    enabled: true,
    image_url: null,
    opacity: 0.12,
    size_px: PLACEHOLDER_LOGO_SIZE_PX,
}

export const EMPTY_DOCUMENT_TEMPLATE_WATERMARK: DocumentTemplateWatermark = {
    enabled: false,
    image_url: null,
    opacity: 0.12,
    size_px: PLACEHOLDER_LOGO_SIZE_PX,
}

export function parseDocumentTemplateWatermark(value: unknown): DocumentTemplateWatermark {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return { ...DEFAULT_DOCUMENT_TEMPLATE_WATERMARK }
    }

    const record = value as Record<string, unknown>
    const opacity =
        typeof record.opacity === "number" && record.opacity >= 0 && record.opacity <= 1
            ? record.opacity
            : DEFAULT_DOCUMENT_TEMPLATE_WATERMARK.opacity
    const size_px =
        typeof record.size_px === "number" && record.size_px > 0
            ? Math.round(record.size_px)
            : DEFAULT_DOCUMENT_TEMPLATE_WATERMARK.size_px

    return {
        enabled: record.enabled === false ? false : true,
        image_url: typeof record.image_url === "string" ? record.image_url : null,
        opacity,
        size_px,
    }
}

export function resolveWatermarkImageSrc(watermark: DocumentTemplateWatermark): string {
    return watermark.image_url?.trim() || DEFAULT_PLACEHOLDER_LOGO_SRC
}

export function isWatermarkVisible(watermark?: DocumentTemplateWatermark | null): boolean {
    return Boolean(watermark?.enabled)
}
