import { cn } from "@/lib/utils"
import type { TemplateLocale } from "@/lib/document-template/locale"

export const DOCUMENT_TEMPLATE_SIGNATURE_STAMP_CLASS = "document-template-signature-stamp"
export const DOCUMENT_TEMPLATE_SIGNATURE_STAMP_GAP_PX = 8
export const DOCUMENT_TEMPLATE_SIGNATURE_IMG_HEIGHT_PX = 56
export const DOCUMENT_TEMPLATE_STAMP_IMG_HEIGHT_PX = 120
/** Floor for layout reserve — stamp + greeting/name/title; never smaller than visual block. */
export const DOCUMENT_TEMPLATE_SIGNATURE_STAMP_MIN_HEIGHT_PX = 150

/**
 * Stable content height for signature+stamp (independent of off-screen DOM measure quirks).
 * Stamp image is the taller column; left column is greeting + signature + two text lines.
 */
export function estimateSignatureStampContentHeightPx(): number {
    const leftColumnPx =
        16 + // greeting
        DOCUMENT_TEMPLATE_SIGNATURE_IMG_HEIGHT_PX +
        4 + // gap under signature
        16 + // name
        16 // title
    return Math.max(DOCUMENT_TEMPLATE_STAMP_IMG_HEIGHT_PX, leftColumnPx)
}

export const DEFAULT_SIGNATURE_IMAGE_URL = "/assets/signature.jpg"
export const DEFAULT_STAMP_IMAGE_URL = "/assets/conditional-letter-stamp.png"

export type DocumentTemplateSignatureStampFields = {
    greeting: string
    signatureUrl: string
    name: string
    title: string
    stampUrl: string
}

export function getDefaultSignatureStampFields(
    locale: TemplateLocale = "en"
): DocumentTemplateSignatureStampFields {
    if (locale === "de") {
        return {
            greeting: "Mit freundlichen Grüßen,",
            signatureUrl: DEFAULT_SIGNATURE_IMAGE_URL,
            name: "Prof. Dr. Volker Wittberg",
            title: "Prorektor Internationales",
            stampUrl: DEFAULT_STAMP_IMAGE_URL,
        }
    }

    return {
        greeting: "With kind regards,",
        signatureUrl: DEFAULT_SIGNATURE_IMAGE_URL,
        name: "Prof. Dr. Volker Wittberg",
        title: "Prorector for International Affairs",
        stampUrl: DEFAULT_STAMP_IMAGE_URL,
    }
}

export const DEFAULT_SIGNATURE_STAMP_FIELDS: DocumentTemplateSignatureStampFields =
    getDefaultSignatureStampFields("en")

export const DOCUMENT_TEMPLATE_SIGNATURE_STAMP_STYLES = cn(
    "[&_.document-template-signature-stamp]:mb-2",
    "[&_.document-template-signature-stamp_table]:w-auto",
    "[&_.document-template-signature-stamp_table]:max-w-full",
    "[&_.document-template-signature-stamp_table]:border-0",
    "[&_.document-template-signature-stamp_table]:border-collapse",
    "[&_.document-template-signature-stamp_td]:border-0",
    "[&_.document-template-signature-stamp_td]:bg-transparent",
    "[&_.document-template-signature-stamp_td]:p-0",
    "[&_.document-template-signature-stamp_td]:align-top",
    "[&_.document-template-signature-stamp_td:first-child]:pr-3",
    "[&_[data-signature-greeting]]:m-0 [&_[data-signature-greeting]]:mb-1",
    "[&_[data-signature-greeting]]:text-[11px] [&_[data-signature-greeting]]:leading-snug",
    "[&_[data-signature-greeting]]:text-[#111827]",
    "[&_[data-signature-greeting]]:font-[Arial,Helvetica,sans-serif]",
    "[&_[data-signature-name]]:m-0 [&_[data-signature-name]]:mt-1",
    "[&_[data-signature-name]]:text-[11px] [&_[data-signature-name]]:leading-snug",
    "[&_[data-signature-name]]:font-medium [&_[data-signature-name]]:text-[#111827]",
    "[&_[data-signature-name]]:font-[Arial,Helvetica,sans-serif]",
    "[&_[data-signature-title]]:m-0",
    "[&_[data-signature-title]]:text-[11px] [&_[data-signature-title]]:leading-snug",
    "[&_[data-signature-title]]:text-[#111827]",
    "[&_[data-signature-title]]:font-[Arial,Helvetica,sans-serif]",
    "[&_[data-signature-image]]:my-0 [&_[data-signature-image]]:block",
    "[&_[data-stamp-image]]:my-0 [&_[data-stamp-image]]:block"
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

function extractDataText(html: string, dataAttr: string): string {
    const match = html.match(
        new RegExp(`${dataAttr}[^>]*>([\\s\\S]*?)<\\/(?:p|span|div)>`, "i")
    )
    return match ? stripHtml(match[1]) : ""
}

export function buildSignatureStampHtml(
    fields: DocumentTemplateSignatureStampFields
): string {
    const greeting = fields.greeting.trim() || DEFAULT_SIGNATURE_STAMP_FIELDS.greeting
    const name = fields.name.trim() || DEFAULT_SIGNATURE_STAMP_FIELDS.name
    const title = fields.title.trim() || DEFAULT_SIGNATURE_STAMP_FIELDS.title
    const signatureUrl =
        fields.signatureUrl.trim() || DEFAULT_SIGNATURE_IMAGE_URL
    const stampUrl = fields.stampUrl.trim() || DEFAULT_STAMP_IMAGE_URL

    return `<div class="${DOCUMENT_TEMPLATE_SIGNATURE_STAMP_CLASS}" data-document-region="signature-stamp" style="background:#ffffff;">
  <table style="width:auto;max-width:100%;border:none;border-collapse:collapse;margin:0;background:#ffffff;">
    <tbody>
      <tr>
        <td style="border:none;vertical-align:top;padding:0 12px 0 0;background:#ffffff;text-align:left;">
          <p data-signature-greeting style="margin:0 0 4px;font-size:11px;line-height:1.35;color:#111827;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(greeting)}</p>
          <img data-signature-image src="${escapeHtml(signatureUrl)}" alt="Signature" style="display:block;margin:0;height:${DOCUMENT_TEMPLATE_SIGNATURE_IMG_HEIGHT_PX}px;width:auto;max-width:220px;object-fit:contain;background:#ffffff;" />
          <p data-signature-name style="margin:4px 0 0;font-size:11px;line-height:1.35;font-weight:500;color:#111827;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(name)}</p>
          <p data-signature-title style="margin:0;font-size:11px;line-height:1.35;color:#111827;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(title)}</p>
        </td>
        <td style="border:none;vertical-align:top;padding:0;background:#ffffff;">
          <img data-stamp-image src="${escapeHtml(stampUrl)}" alt="Official stamp" style="display:block;margin:0;height:${DOCUMENT_TEMPLATE_STAMP_IMG_HEIGHT_PX}px;width:auto;max-width:140px;object-fit:contain;background:#ffffff;" />
        </td>
      </tr>
    </tbody>
  </table>
</div>`
}

export function parseSignatureStampHtml(
    html: string
): DocumentTemplateSignatureStampFields | null {
    const normalized = html.trim()
    if (!normalized) return null

    return {
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
    }
}

export function hasTemplateSignatureStamp(html: string): boolean {
    return (
        html.includes(`data-document-region="signature-stamp"`) ||
        html.includes(DOCUMENT_TEMPLATE_SIGNATURE_STAMP_CLASS)
    )
}
