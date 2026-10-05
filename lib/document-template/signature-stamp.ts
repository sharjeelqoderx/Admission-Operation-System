import { cn } from "@/lib/utils"
import type { TemplateLocale } from "@/lib/document-template/locale"

export const DOCUMENT_TEMPLATE_SIGNATURE_STAMP_CLASS = "document-template-signature-stamp"
export const DOCUMENT_TEMPLATE_SIGNATURE_STAMP_GAP_PX = 8
/** ~2 cm — typical scanned signature line height in Word. */
export const DOCUMENT_TEMPLATE_SIGNATURE_IMG_HEIGHT_PX = 56
/** ~4 cm — typical official stamp height in Word offer letters. */
export const DOCUMENT_TEMPLATE_STAMP_IMG_HEIGHT_PX = 152
export const DOCUMENT_TEMPLATE_SIGNATURE_STAMP_TEXT_FONT_SIZE_PX = 11

export type DocumentTemplateSignatureStampAlign = "left" | "center" | "right"

export const DOCUMENT_TEMPLATE_SIGNATURE_STAMP_ALIGN_OPTIONS: {
    value: DocumentTemplateSignatureStampAlign
    label: string
}[] = [
    { value: "left", label: "Left" },
    { value: "center", label: "Center" },
    { value: "right", label: "Right" },
]

export const DOCUMENT_TEMPLATE_SIGNATURE_STAMP_COLUMN_GAP_DEFAULT_PX = 12
export const DOCUMENT_TEMPLATE_SIGNATURE_STAMP_BLOCK_OFFSET_MIN_PX = -80
export const DOCUMENT_TEMPLATE_SIGNATURE_STAMP_BLOCK_OFFSET_MAX_PX = 80
export const DOCUMENT_TEMPLATE_STAMP_FINE_OFFSET_MIN_PX = -120
export const DOCUMENT_TEMPLATE_STAMP_FINE_OFFSET_MAX_PX = 120
export const DOCUMENT_TEMPLATE_SIGNATURE_FINE_OFFSET_MIN_PX = -48
export const DOCUMENT_TEMPLATE_SIGNATURE_FINE_OFFSET_MAX_PX = 48
export const DOCUMENT_TEMPLATE_SIGNATURE_STAMP_COLUMN_GAP_MAX_PX = 48

/** Floor for layout reserve — stamp + greeting/name/title; never smaller than visual block. */
export const DOCUMENT_TEMPLATE_SIGNATURE_STAMP_MIN_HEIGHT_PX = 150

/**
 * Stable content height for signature+stamp (independent of off-screen DOM measure quirks).
 */
export function estimateSignatureStampContentHeightPx(
    fields?: Pick<
        DocumentTemplateSignatureStampFields,
        | "signatureHeightPx"
        | "stampHeightPx"
        | "textFontSizePx"
        | "showSignatureBlock"
        | "showStamp"
    >
): number {
    const showSignature = fields?.showSignatureBlock !== false
    const showStamp = fields?.showStamp !== false

    const textPx = fields?.textFontSizePx ?? DOCUMENT_TEMPLATE_SIGNATURE_STAMP_TEXT_FONT_SIZE_PX
    const signaturePx = fields?.signatureHeightPx ?? DOCUMENT_TEMPLATE_SIGNATURE_IMG_HEIGHT_PX
    const stampPx = fields?.stampHeightPx ?? DOCUMENT_TEMPLATE_STAMP_IMG_HEIGHT_PX

    const leftColumnPx =
        textPx +
        4 +
        signaturePx +
        4 +
        textPx +
        4 +
        textPx

    if (showSignature && !showStamp) {
        return Math.max(leftColumnPx, DOCUMENT_TEMPLATE_SIGNATURE_STAMP_MIN_HEIGHT_PX)
    }

    if (showStamp && !showSignature) {
        return Math.max(stampPx, DOCUMENT_TEMPLATE_SIGNATURE_STAMP_MIN_HEIGHT_PX)
    }

    return Math.max(stampPx, leftColumnPx, DOCUMENT_TEMPLATE_SIGNATURE_STAMP_MIN_HEIGHT_PX)
}

export const DEFAULT_SIGNATURE_IMAGE_URL = "/assets/signature.jpg"
export const DEFAULT_STAMP_IMAGE_URL = "/assets/conditional-letter-stamp.png"

export type DocumentTemplateSignatureStampFields = {
    greeting: string
    signatureUrl: string
    name: string
    title: string
    stampUrl: string
    /** Whole block (row) on the page */
    align: DocumentTemplateSignatureStampAlign
    textFontSizePx: number
    signatureHeightPx: number
    stampHeightPx: number
    showSignatureBlock: boolean
    showStamp: boolean
    /** When both are shown: stamp column before signature column */
    stampFirst: boolean
    /** Stamp image alignment (stamp-only or stamp column) */
    stampAlign: DocumentTemplateSignatureStampAlign
    /** Greeting / name / title alignment in the signature column */
    signatureTextAlign: DocumentTemplateSignatureStampAlign
    columnGapPx: number
    blockOffsetPx: number
    stampFineOffsetPx: number
    signatureFineOffsetPx: number
}

export function clampSignatureStampTextFontSizePx(value: number): number {
    if (!Number.isFinite(value)) return DOCUMENT_TEMPLATE_SIGNATURE_STAMP_TEXT_FONT_SIZE_PX
    return Math.min(18, Math.max(8, Math.round(value)))
}

export function clampSignatureStampImageHeightPx(value: number, min = 32, max = 240): number {
    if (!Number.isFinite(value)) return min
    return Math.min(max, Math.max(min, Math.round(value)))
}

export function clampSignatureStampBlockOffsetPx(value: number): number {
    if (!Number.isFinite(value)) return 0
    return Math.min(
        DOCUMENT_TEMPLATE_SIGNATURE_STAMP_BLOCK_OFFSET_MAX_PX,
        Math.max(DOCUMENT_TEMPLATE_SIGNATURE_STAMP_BLOCK_OFFSET_MIN_PX, Math.round(value))
    )
}

export function clampStampFineOffsetPx(value: number): number {
    if (!Number.isFinite(value)) return 0
    return Math.min(
        DOCUMENT_TEMPLATE_STAMP_FINE_OFFSET_MAX_PX,
        Math.max(DOCUMENT_TEMPLATE_STAMP_FINE_OFFSET_MIN_PX, Math.round(value))
    )
}

export function clampSignatureFineOffsetPx(value: number): number {
    if (!Number.isFinite(value)) return 0
    return Math.min(
        DOCUMENT_TEMPLATE_SIGNATURE_FINE_OFFSET_MAX_PX,
        Math.max(DOCUMENT_TEMPLATE_SIGNATURE_FINE_OFFSET_MIN_PX, Math.round(value))
    )
}

/** @deprecated Use clampStampFineOffsetPx or clampSignatureFineOffsetPx */
export function clampSignatureStampFineOffsetPx(value: number): number {
    return clampStampFineOffsetPx(value)
}

/** Map signed px offset to 0–100 slider (50 = 0px). */
export function signedOffsetToSliderPercent(
    px: number,
    minPx: number,
    maxPx: number
): number {
    const range = maxPx - minPx
    if (range <= 0) return 50
    const clamped = Math.min(maxPx, Math.max(minPx, px))
    return ((clamped - minPx) / range) * 100
}

/** Map 0–100 slider back to signed px (50 = 0px). */
export function sliderPercentToSignedOffset(
    percent: number,
    minPx: number,
    maxPx: number
): number {
    const range = maxPx - minPx
    if (range <= 0) return 0
    const clampedPercent = Math.min(100, Math.max(0, percent))
    return Math.round(minPx + (clampedPercent / 100) * range)
}

export function clampSignatureStampColumnGapPx(value: number): number {
    if (!Number.isFinite(value)) return DOCUMENT_TEMPLATE_SIGNATURE_STAMP_COLUMN_GAP_DEFAULT_PX
    return Math.min(
        DOCUMENT_TEMPLATE_SIGNATURE_STAMP_COLUMN_GAP_MAX_PX,
        Math.max(0, Math.round(value))
    )
}

export function normalizeSignatureStampFields(
    fields: DocumentTemplateSignatureStampFields
): DocumentTemplateSignatureStampFields {
    let showSignatureBlock = fields.showSignatureBlock !== false
    let showStamp = fields.showStamp !== false

    if (!showSignatureBlock && !showStamp) {
        showSignatureBlock = true
        showStamp = true
    }

    return {
        ...fields,
        showSignatureBlock,
        showStamp,
        align: fields.align ?? "left",
        stampAlign: fields.stampAlign ?? fields.align ?? "left",
        signatureTextAlign: fields.signatureTextAlign ?? "left",
        columnGapPx: clampSignatureStampColumnGapPx(fields.columnGapPx),
        blockOffsetPx: clampSignatureStampBlockOffsetPx(fields.blockOffsetPx),
        stampFineOffsetPx: clampStampFineOffsetPx(fields.stampFineOffsetPx),
        signatureFineOffsetPx: clampSignatureFineOffsetPx(fields.signatureFineOffsetPx),
        textFontSizePx: clampSignatureStampTextFontSizePx(fields.textFontSizePx),
        signatureHeightPx: clampSignatureStampImageHeightPx(fields.signatureHeightPx, 32, 200),
        stampHeightPx: clampSignatureStampImageHeightPx(fields.stampHeightPx, 48, 320),
    }
}

export function getDefaultSignatureStampFields(
    locale: TemplateLocale = "en"
): DocumentTemplateSignatureStampFields {
    const base: Omit<
        DocumentTemplateSignatureStampFields,
        "greeting" | "name" | "title"
    > = {
        signatureUrl: DEFAULT_SIGNATURE_IMAGE_URL,
        stampUrl: DEFAULT_STAMP_IMAGE_URL,
        align: "left",
        textFontSizePx: DOCUMENT_TEMPLATE_SIGNATURE_STAMP_TEXT_FONT_SIZE_PX,
        signatureHeightPx: DOCUMENT_TEMPLATE_SIGNATURE_IMG_HEIGHT_PX,
        stampHeightPx: DOCUMENT_TEMPLATE_STAMP_IMG_HEIGHT_PX,
        showSignatureBlock: true,
        showStamp: true,
        stampFirst: false,
        stampAlign: "left",
        signatureTextAlign: "left",
        columnGapPx: DOCUMENT_TEMPLATE_SIGNATURE_STAMP_COLUMN_GAP_DEFAULT_PX,
        blockOffsetPx: 0,
        stampFineOffsetPx: 0,
        signatureFineOffsetPx: 0,
    }

    if (locale === "de") {
        return normalizeSignatureStampFields({
            ...base,
            greeting: "Mit freundlichen Grüßen,",
            name: "Prof. Dr. Volker Wittberg",
            title: "Prorektor Internationales",
        })
    }

    return normalizeSignatureStampFields({
        ...base,
        greeting: "With kind regards,",
        name: "Prof. Dr. Volker Wittberg",
        title: "Prorector for International Affairs",
    })
}

export const DEFAULT_SIGNATURE_STAMP_FIELDS: DocumentTemplateSignatureStampFields =
    getDefaultSignatureStampFields("en")

export const DOCUMENT_TEMPLATE_SIGNATURE_STAMP_STYLES = cn(
    "[&_.document-template-signature-stamp]:mb-2",
    "[&_.document-template-signature-stamp]:overflow-visible",
    "[&_[data-stamp-column]]:overflow-visible",
    "[&_[data-stamp-nudge]]:overflow-visible",
    "[&_[data-signature-column]]:overflow-visible",
    "[&_.document-template-signature-stamp_table]:w-auto",
    "[&_.document-template-signature-stamp_table]:max-w-full",
    "[&_.document-template-signature-stamp_table]:border-0",
    "[&_.document-template-signature-stamp_table]:border-collapse",
    "[&_.document-template-signature-stamp_td]:border-0",
    "[&_.document-template-signature-stamp_td]:bg-transparent",
    "[&_.document-template-signature-stamp_td]:p-0",
    "[&_.document-template-signature-stamp_td]:align-middle",
    "[&_[data-signature-greeting]]:m-0 [&_[data-signature-greeting]]:mb-1",
    "[&_[data-signature-greeting]]:leading-snug",
    "[&_[data-signature-greeting]]:text-[#111827]",
    "[&_[data-signature-greeting]]:font-[Arial,Helvetica,sans-serif]",
    "[&_[data-signature-name]]:m-0 [&_[data-signature-name]]:mt-1",
    "[&_[data-signature-name]]:leading-snug",
    "[&_[data-signature-name]]:font-medium [&_[data-signature-name]]:text-[#111827]",
    "[&_[data-signature-name]]:font-[Arial,Helvetica,sans-serif]",
    "[&_[data-signature-title]]:m-0",
    "[&_[data-signature-title]]:leading-snug",
    "[&_[data-signature-title]]:text-[#111827]",
    "[&_[data-signature-title]]:font-[Arial,Helvetica,sans-serif]",
    "[&_[data-signature-image]]:my-0 [&_[data-signature-image]]:max-w-full",
    "[&_[data-stamp-image]]:my-0 [&_[data-stamp-image]]:max-w-full"
)

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
}

function stripHtml(value: string): string {
    return value
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .trim()
}

function extractImgSrc(html: string, dataAttr: string): string {
    const match = html.match(new RegExp(`<img\\b[^>]*\\b${dataAttr}\\b[^>]*>`, "i"))
    if (!match) return ""
    const srcMatch = match[0].match(/\bsrc="([^"]*)"/i)
    return srcMatch?.[1]?.trim() ?? ""
}

function extractImgHeightPx(html: string, dataAttr: string, fallback: number): number {
    const match = html.match(new RegExp(`<img\\b[^>]*\\b${dataAttr}\\b[^>]*>`, "i"))
    if (!match) return fallback
    const heightMatch = match[0].match(/\bheight:\s*(\d+(?:\.\d+)?)px/i)
    if (!heightMatch) return fallback
    return clampSignatureStampImageHeightPx(Number(heightMatch[1]), 24, 320)
}

function extractDataText(html: string, dataAttr: string): string {
    const match = html.match(
        new RegExp(`${dataAttr}[^>]*>([\\s\\S]*?)<\\/(?:p|span|div)>`, "i")
    )
    return match ? stripHtml(match[1]) : ""
}

function extractTextFontSizePx(html: string): number {
    const match = html.match(/data-signature-greeting[^>]*style="[^"]*font-size:\s*(\d+)px/i)
    if (!match) return DOCUMENT_TEMPLATE_SIGNATURE_STAMP_TEXT_FONT_SIZE_PX
    return clampSignatureStampTextFontSizePx(Number(match[1]))
}

function extractAlign(html: string, attr: string, fallback: DocumentTemplateSignatureStampAlign): DocumentTemplateSignatureStampAlign {
    const attrMatch = html.match(new RegExp(`${attr}="(left|center|right)"`, "i"))
    if (attrMatch) return attrMatch[1] as DocumentTemplateSignatureStampAlign
    return fallback
}

function extractBoolAttr(html: string, attr: string, fallback: boolean): boolean {
    const match = html.match(new RegExp(`${attr}="(true|false)"`, "i"))
    if (!match) return fallback
    return match[1].toLowerCase() === "true"
}

function extractIntAttr(html: string, attr: string, fallback: number): number {
    const match = html.match(new RegExp(`${attr}="(-?\\d+)"`, "i"))
    if (!match) return fallback
    return Number(match[1])
}

function flexJustifyContent(align: DocumentTemplateSignatureStampAlign): string {
    if (align === "center") return "center"
    if (align === "right") return "flex-end"
    return "flex-start"
}

function translateXStyle(offsetPx: number): string {
    if (!offsetPx) return ""
    return `transform:translateX(${offsetPx}px);`
}

export function buildSignatureStampHtml(
    rawFields: DocumentTemplateSignatureStampFields
): string {
    const fields = normalizeSignatureStampFields(rawFields)
    const greeting = fields.greeting.trim() || DEFAULT_SIGNATURE_STAMP_FIELDS.greeting
    const name = fields.name.trim() || DEFAULT_SIGNATURE_STAMP_FIELDS.name
    const title = fields.title.trim() || DEFAULT_SIGNATURE_STAMP_FIELDS.title
    const signatureUrl =
        fields.signatureUrl.trim() || DEFAULT_SIGNATURE_IMAGE_URL
    const stampUrl = fields.stampUrl.trim() || DEFAULT_STAMP_IMAGE_URL

    const textStyle = `margin:0;font-size:${fields.textFontSizePx}px;line-height:1.35;color:#111827;font-family:Arial,Helvetica,sans-serif;`

    const stampImgHtml = `<img data-stamp-image src="${escapeHtml(stampUrl)}" alt="Official stamp" style="display:inline-block;vertical-align:middle;height:${fields.stampHeightPx}px;width:auto;max-width:180px;object-fit:contain;background:#ffffff;" />`

    const stampNudgeHtml = `<span data-stamp-nudge style="display:inline-block;vertical-align:middle;${translateXStyle(fields.stampFineOffsetPx)}">${stampImgHtml}</span>`

    const signatureInnerHtml = `<p data-signature-greeting style="${textStyle}margin-bottom:4px;">${escapeHtml(greeting)}</p>
          <img data-signature-image src="${escapeHtml(signatureUrl)}" alt="Signature" style="display:inline-block;vertical-align:middle;height:${fields.signatureHeightPx}px;width:auto;max-width:220px;object-fit:contain;background:#ffffff;" />
          <p data-signature-name style="${textStyle}margin-top:4px;font-weight:500;">${escapeHtml(name)}</p>
          <p data-signature-title style="${textStyle}">${escapeHtml(title)}</p>`

    const signatureBlockHtml = `<div data-signature-column style="flex:0 0 auto;box-sizing:border-box;text-align:${fields.signatureTextAlign};${translateXStyle(fields.signatureFineOffsetPx)}">${signatureInnerHtml}</div>`

    const stampBlockHtml = `<div data-stamp-column style="flex:0 0 auto;box-sizing:border-box;">${stampNudgeHtml}</div>`

    const stampAlignedCellHtml = `<div data-stamp-column style="justify-self:stretch;display:flex;align-items:center;justify-content:${flexJustifyContent(fields.stampAlign)};box-sizing:border-box;min-width:0;">${stampNudgeHtml}</div>`

    const layoutAttrs = [
        `data-signature-align="${fields.align}"`,
        `data-show-signature="${fields.showSignatureBlock ? "true" : "false"}"`,
        `data-show-stamp="${fields.showStamp ? "true" : "false"}"`,
        `data-stamp-first="${fields.stampFirst ? "true" : "false"}"`,
        `data-stamp-align="${fields.stampAlign}"`,
        `data-signature-text-align="${fields.signatureTextAlign}"`,
        `data-column-gap="${fields.columnGapPx}"`,
        `data-block-offset="${fields.blockOffsetPx}"`,
        `data-stamp-offset="${fields.stampFineOffsetPx}"`,
        `data-signature-offset="${fields.signatureFineOffsetPx}"`,
    ].join(" ")

    let rowInner = ""

    if (fields.showStamp && !fields.showSignatureBlock) {
        rowInner = `<div data-stamp-column style="width:100%;box-sizing:border-box;text-align:${fields.stampAlign};">${stampNudgeHtml}</div>`
    } else if (fields.showSignatureBlock && !fields.showStamp) {
        rowInner = `<div style="width:100%;box-sizing:border-box;text-align:${fields.signatureTextAlign};"><div data-signature-column style="display:inline-block;text-align:${fields.signatureTextAlign};${translateXStyle(fields.signatureFineOffsetPx)}">${signatureInnerHtml}</div></div>`
    } else if (fields.stampAlign === "left") {
        const pairStyle = [
            "width:100%",
            "box-sizing:border-box",
            "display:flex",
            "flex-direction:row",
            "align-items:center",
            "flex-wrap:nowrap",
            `justify-content:${flexJustifyContent(fields.align)}`,
            `gap:${fields.columnGapPx}px`,
            translateXStyle(fields.blockOffsetPx),
        ].join(";")
        rowInner = `<div style="${pairStyle}">${
            fields.stampFirst
                ? `${stampBlockHtml}${signatureBlockHtml}`
                : `${signatureBlockHtml}${stampBlockHtml}`
        }</div>`
    } else if (fields.stampFirst) {
        rowInner = `<div style="width:100%;max-width:100%;display:grid;grid-template-columns:auto 1fr;column-gap:${fields.columnGapPx}px;align-items:center;box-sizing:border-box;${translateXStyle(fields.blockOffsetPx)}">
        ${stampBlockHtml}
        <div data-signature-column style="justify-self:start;text-align:${fields.signatureTextAlign};${translateXStyle(fields.signatureFineOffsetPx)}">${signatureInnerHtml}</div>
      </div>`
    } else {
        rowInner = `<div style="width:100%;max-width:100%;display:grid;grid-template-columns:auto 1fr;column-gap:${fields.columnGapPx}px;align-items:center;box-sizing:border-box;${translateXStyle(fields.blockOffsetPx)}">
        ${signatureBlockHtml}
        ${stampAlignedCellHtml}
      </div>`
    }

    return `<div class="${DOCUMENT_TEMPLATE_SIGNATURE_STAMP_CLASS}" data-document-region="signature-stamp" ${layoutAttrs} style="width:100%;box-sizing:border-box;background:#ffffff;">
  ${rowInner}
</div>`
}

export function parseSignatureStampHtml(
    html: string
): DocumentTemplateSignatureStampFields | null {
    const normalized = html.trim()
    if (!normalized) return null

    const rowAlign = extractAlign(normalized, "data-signature-align", "left")

    return normalizeSignatureStampFields({
        greeting:
            extractDataText(normalized, "data-signature-greeting") ||
            DEFAULT_SIGNATURE_STAMP_FIELDS.greeting,
        signatureUrl:
            extractImgSrc(normalized, "data-signature-image") ||
            DEFAULT_SIGNATURE_IMAGE_URL,
        name:
            extractDataText(normalized, "data-signature-name") ||
            DEFAULT_SIGNATURE_STAMP_FIELDS.name,
        title:
            extractDataText(normalized, "data-signature-title") ||
            DEFAULT_SIGNATURE_STAMP_FIELDS.title,
        stampUrl:
            extractImgSrc(normalized, "data-stamp-image") || DEFAULT_STAMP_IMAGE_URL,
        align: rowAlign,
        textFontSizePx: extractTextFontSizePx(normalized),
        signatureHeightPx: extractImgHeightPx(
            normalized,
            "data-signature-image",
            DOCUMENT_TEMPLATE_SIGNATURE_IMG_HEIGHT_PX
        ),
        stampHeightPx: extractImgHeightPx(
            normalized,
            "data-stamp-image",
            DOCUMENT_TEMPLATE_STAMP_IMG_HEIGHT_PX
        ),
        showSignatureBlock: extractBoolAttr(normalized, "data-show-signature", true),
        showStamp: extractBoolAttr(normalized, "data-show-stamp", true),
        stampFirst: extractBoolAttr(normalized, "data-stamp-first", false),
        stampAlign: extractAlign(normalized, "data-stamp-align", rowAlign),
        signatureTextAlign: extractAlign(normalized, "data-signature-text-align", "left"),
        columnGapPx: clampSignatureStampColumnGapPx(
            extractIntAttr(
                normalized,
                "data-column-gap",
                DOCUMENT_TEMPLATE_SIGNATURE_STAMP_COLUMN_GAP_DEFAULT_PX
            )
        ),
        blockOffsetPx: clampSignatureStampBlockOffsetPx(
            extractIntAttr(normalized, "data-block-offset", 0)
        ),
        stampFineOffsetPx: clampStampFineOffsetPx(
            extractIntAttr(normalized, "data-stamp-offset", 0)
        ),
        signatureFineOffsetPx: clampSignatureFineOffsetPx(
            extractIntAttr(normalized, "data-signature-offset", 0)
        ),
    })
}

export function hasTemplateSignatureStamp(html: string): boolean {
    return (
        html.includes(`data-document-region="signature-stamp"`) ||
        html.includes(DOCUMENT_TEMPLATE_SIGNATURE_STAMP_CLASS)
    )
}
