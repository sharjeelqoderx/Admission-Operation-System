export const DOCUMENT_TEMPLATE_FONT_SIZE_MIN = 8
export const DOCUMENT_TEMPLATE_FONT_SIZE_MAX = 72
export const DOCUMENT_TEMPLATE_FONT_SIZE_DEFAULT = 14
export const DOCUMENT_TEMPLATE_FONT_SIZE_STEP = 1

export function getDocumentTemplateFontSizeOptions(): number[] {
    return Array.from(
        { length: DOCUMENT_TEMPLATE_FONT_SIZE_MAX - DOCUMENT_TEMPLATE_FONT_SIZE_MIN + 1 },
        (_, index) => DOCUMENT_TEMPLATE_FONT_SIZE_MIN + index
    )
}

export function parseDocumentTemplateFontSizePx(value: string | null | undefined): number {
    if (!value) {
        return DOCUMENT_TEMPLATE_FONT_SIZE_DEFAULT
    }

    const match = value.match(/^(\d+(?:\.\d+)?)px$/)

    if (!match) {
        return DOCUMENT_TEMPLATE_FONT_SIZE_DEFAULT
    }

    return Math.round(parseFloat(match[1]))
}

export function clampDocumentTemplateFontSizePx(size: number): number {
    return Math.min(
        DOCUMENT_TEMPLATE_FONT_SIZE_MAX,
        Math.max(DOCUMENT_TEMPLATE_FONT_SIZE_MIN, size)
    )
}

export function formatDocumentTemplateFontSizePx(size: number): string {
    return `${clampDocumentTemplateFontSizePx(size)}px`
}
