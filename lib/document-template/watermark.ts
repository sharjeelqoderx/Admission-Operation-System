import {
    DEFAULT_PLACEHOLDER_LOGO_SRC,
    PLACEHOLDER_LOGO_SIZE_PX,
} from "@/lib/document-template/a4-document"

export type DocumentTemplateWatermarkPosition = "center" | "top" | "bottom"

export type DocumentTemplateWatermark = {
    enabled: boolean
    image_url: string | null
    opacity: number
    size_px: number
    position: DocumentTemplateWatermarkPosition
    rotation_deg: number
}

export const DEFAULT_DOCUMENT_TEMPLATE_WATERMARK: DocumentTemplateWatermark = {
    enabled: true,
    image_url: null,
    opacity: 0.12,
    size_px: PLACEHOLDER_LOGO_SIZE_PX,
    position: "center",
    rotation_deg: 0,
}

export const EMPTY_DOCUMENT_TEMPLATE_WATERMARK: DocumentTemplateWatermark = {
    enabled: false,
    image_url: null,
    opacity: 0.12,
    size_px: PLACEHOLDER_LOGO_SIZE_PX,
    position: "center",
    rotation_deg: 0,
}

export function resolveWatermarkPosition(value: unknown): DocumentTemplateWatermarkPosition {
    if (value === "top" || value === "bottom") return value
    return "center"
}

export function resolveWatermarkRotation(value: unknown): number {
    if (typeof value !== "number" || !Number.isFinite(value)) return 0
    return Math.max(-180, Math.min(180, Math.round(value)))
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
        position: resolveWatermarkPosition(record.position),
        rotation_deg: resolveWatermarkRotation(record.rotation_deg),
    }
}

export function resolveWatermarkImageSrc(watermark: DocumentTemplateWatermark): string {
    return watermark.image_url?.trim() || DEFAULT_PLACEHOLDER_LOGO_SRC
}

export function isWatermarkVisible(watermark?: DocumentTemplateWatermark | null): boolean {
    return Boolean(watermark?.enabled)
}

export function getWatermarkFlexStyles(position: DocumentTemplateWatermarkPosition): {
    alignItems: "center" | "flex-start" | "flex-end"
    justifyContent: "center"
    paddingTop?: string
    paddingBottom?: string
} {
    switch (position) {
        case "top":
            return { alignItems: "flex-start", justifyContent: "center", paddingTop: "10%" }
        case "bottom":
            return { alignItems: "flex-end", justifyContent: "center", paddingBottom: "10%" }
        default:
            return { alignItems: "center", justifyContent: "center" }
    }
}

export function getWatermarkImageStyle(watermark: DocumentTemplateWatermark): {
    width: number
    height: number
    opacity: number
    objectFit: "contain"
    transform: string
} {
    return {
        width: watermark.size_px,
        height: watermark.size_px,
        opacity: watermark.opacity,
        objectFit: "contain",
        transform: `rotate(${watermark.rotation_deg}deg)`,
    }
}

export function buildWatermarkContainerInlineStyle(
    watermark: DocumentTemplateWatermark
): string {
    const flex = getWatermarkFlexStyles(watermark.position)
    const parts = [
        `--watermark-size:${watermark.size_px}px`,
        `--watermark-opacity:${watermark.opacity}`,
        "display:flex",
        `align-items:${flex.alignItems}`,
        `justify-content:${flex.justifyContent}`,
    ]
    if (flex.paddingTop) parts.push(`padding-top:${flex.paddingTop}`)
    if (flex.paddingBottom) parts.push(`padding-bottom:${flex.paddingBottom}`)
    return parts.join(";")
}

export function buildWatermarkImageInlineStyle(watermark: DocumentTemplateWatermark): string {
    const imageStyle = getWatermarkImageStyle(watermark)
    return [
        `opacity:${imageStyle.opacity}`,
        `width:${imageStyle.width}px`,
        `height:${imageStyle.height}px`,
        "object-fit:contain",
        `transform:${imageStyle.transform}`,
    ].join(";")
}
