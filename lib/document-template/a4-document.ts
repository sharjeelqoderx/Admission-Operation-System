import { cn } from "@/lib/utils"

export const DOCUMENT_HEADER_IMAGE_CLASS = "document-header-image"
export const DOCUMENT_IMAGE_CLASS = "document-image"
export const DOCUMENT_CENTER_LOGO_CLASS = "document-center-logo"
export const DOCUMENT_LOGO_CLASS = "document-logo"
export const DOCUMENT_LOGO_LINE_CLASS = "document-logo-line"
export const DOCUMENT_MAIN_HEADING_CLASS = "document-main-heading"
export const DOCUMENT_PAGE_BREAK_CLASS = "document-page-break"
export const DOCUMENT_PAGE_WATERMARK_CLASS = "document-page-watermark"

/** Splits stored template HTML into one block per page (page-break markers are removed). */
export const DOCUMENT_PAGE_BREAK_MARKER_REGEX =
    /<div[^>]*data-page-break=["']true["'][^>]*>[\s\S]*?<\/div>/gi

/** Canonical serialized page-break marker used when normalizing template HTML. */
export const PAGE_BREAK_MARKER_HTML = `<div class="${DOCUMENT_PAGE_BREAK_CLASS}" data-page-break="true"></div>`

function isBlankPageSegment(segment: string): boolean {
    return segment.trim().length === 0
}

/**
 * Splits template body HTML into one segment per page.
 *
 * - Empty segments in the middle are preserved (intentional blank pages).
 * - Stray page breaks at the very start/end are ignored so they never create
 *   phantom pages or collapse the document back into auto pagination.
 */
export function splitTemplateBodyIntoPages(bodyHtml: string): string[] {
    const normalized = bodyHtml.trim()
    if (!normalized) return [""]

    const parts = normalized
        .split(DOCUMENT_PAGE_BREAK_MARKER_REGEX)
        .map((part) => part.trim())

    let start = 0
    while (start < parts.length && isBlankPageSegment(parts[start])) {
        start += 1
    }

    let end = parts.length
    while (end > start && isBlankPageSegment(parts[end - 1])) {
        end -= 1
    }

    const pages = parts.slice(start, end)

    if (pages.length === 0) {
        // The body contained nothing but stray page-break markers.
        return [""]
    }

    if (pages.length === 1 && start === 0 && end === parts.length) {
        // No page-break markers at all — return the body untouched so callers
        // can distinguish "single manual page" from "auto paginated" content.
        return [normalized]
    }

    return pages
}

/**
 * Removes stray page-break markers at the very start/end of template body HTML
 * and normalizes the remaining markers to the canonical serialized form.
 * Middle markers (including intentional blank pages) are preserved.
 */
export function stripLeadingTrailingPageBreakMarkers(html: string): string {
    const normalized = html.trim()
    if (!normalized) return ""

    const containsMarker = new RegExp(DOCUMENT_PAGE_BREAK_MARKER_REGEX.source, "i")
    if (!containsMarker.test(normalized)) {
        return normalized
    }

    return splitTemplateBodyIntoPages(normalized).join(PAGE_BREAK_MARKER_HTML)
}

export function buildDocumentPageWatermarkHtml(
    watermark?: {
        enabled?: boolean
        image_url?: string | null
        opacity?: number
        size_px?: number
    } | null
): string {
    if (watermark?.enabled === false) {
        return ""
    }

    const logoSrc = watermark?.image_url?.trim() || DEFAULT_PLACEHOLDER_LOGO_SRC
    const sizePx = watermark?.size_px && watermark.size_px > 0 ? watermark.size_px : PLACEHOLDER_LOGO_SIZE_PX
    const opacity =
        typeof watermark?.opacity === "number" && watermark.opacity >= 0 && watermark.opacity <= 1
            ? watermark.opacity
            : 0.12

    return `<div class="${DOCUMENT_PAGE_WATERMARK_CLASS}" aria-hidden="true" style="--watermark-size:${sizePx}px;--watermark-opacity:${opacity};"><img src="${logoSrc}" alt="" width="${sizePx}" height="${sizePx}" style="opacity:${opacity};width:${sizePx}px;height:${sizePx}px;" /></div>`
}

export const A4_DOCUMENT_MULTI_PAGE_STACK_CLASS = cn("flex flex-col items-center gap-4")

export const DOCUMENT_HEADING_STYLES = cn(
    "[&_h1]:mb-4 [&_h1]:text-[28px] [&_h1]:font-bold [&_h1]:leading-tight [&_h1]:text-gray-900",
    "[&_h2]:mb-3 [&_h2]:text-[22px] [&_h2]:font-semibold [&_h2]:leading-snug [&_h2]:text-gray-900",
    "[&_h3]:mb-2 [&_h3]:text-[18px] [&_h3]:font-semibold [&_h3]:leading-snug [&_h3]:text-gray-800",
    "[&_h1.document-main-heading]:text-center [&_h1.document-main-heading]:uppercase",
    "[&_h1.document-main-heading]:tracking-[0.08em] [&_h1.document-main-heading]:text-brand-byzantine",
    "[&_h1.document-main-heading]:text-[24px] [&_h1.document-main-heading]:font-black"
)

/** Visual A4 sheet used as a background layer in the paginated editor. */
export const A4_DOCUMENT_PAGE_SHELL_CLASS = cn(
    "a4-document-page",
    "relative mx-auto box-border overflow-hidden bg-white shadow-[0_4px_24px_rgba(0,0,0,0.12)]",
    "w-[210mm] h-[297mm] min-h-[297mm] max-h-[297mm] max-w-full shrink-0"
)

/** A4 page shell — 210mm × 297mm with standard document margins. */
export const A4_DOCUMENT_PAGE_CLASS = cn(
    A4_DOCUMENT_PAGE_SHELL_CLASS,
    "px-[15mm] py-[20mm]"
)

/**
 * A4 sheet that may grow taller than 297mm when a page's content overflows.
 * Used by the editor and on-screen preview so both stay visually identical;
 * physical print still targets a fixed A4 height.
 */
export const A4_DOCUMENT_GROWING_PAGE_CLASS = cn(
    "a4-document-page",
    "relative box-border overflow-hidden bg-white shrink-0",
    "w-[210mm] min-h-[297mm] max-w-full px-[15mm] py-[20mm]",
    "shadow-[0_4px_24px_rgba(0,0,0,0.12)]"
)

export const A4_PAGE_HEIGHT_MM = 297
export const A4_PAGE_WIDTH_MM = 210
export const A4_PAGE_PADDING_X_MM = 15
export const A4_PAGE_PADDING_Y_MM = 20
export const A4_PAGE_STACK_GAP_PX = 16

export function mmToPx(mm: number): number {
    return (mm * 96) / 25.4
}

export const A4_PAGE_HEIGHT_PX = mmToPx(A4_PAGE_HEIGHT_MM)

export const A4_DOCUMENT_CONTENT_CLASS = cn(
    "prose prose-sm max-w-none w-full",
    "focus:outline-none",
    DOCUMENT_HEADING_STYLES,
    "[&_table]:w-full [&_table]:border-collapse",
    "[&_td]:border [&_td]:border-border [&_td]:p-2",
    "[&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:p-2",
    "[&_img.document-header-image]:mx-auto [&_img.document-header-image]:mb-6",
    "[&_img.document-header-image]:block [&_img.document-header-image]:max-h-[96px]",
    "[&_img.document-header-image]:w-auto [&_img.document-header-image]:object-contain",
    "[&_img.document-center-logo]:mx-auto [&_img.document-center-logo]:my-6",
    "[&_img.document-center-logo]:inline-block [&_img.document-center-logo]:align-middle",
    "[&_img.document-center-logo]:object-contain",
    "[&_p.document-logo-line]:my-3 [&_p.document-logo-line]:min-h-[56px] [&_p.document-logo-line]:leading-none",
    "[&_p.document-logo-line]:flex [&_p.document-logo-line]:flex-wrap [&_p.document-logo-line]:items-center",
    "[&_p.document-logo-line]:gap-3",
    "[&_img.document-logo]:inline-block [&_img.document-logo]:align-middle [&_img.document-logo]:object-contain",
    "[&_img.document-logo]:max-h-[120px] [&_img.document-logo]:h-auto",
    "[&_img.document-image]:my-4 [&_img.document-image]:max-w-full [&_img.document-image]:h-auto",
    // Signature + stamp row (name under sign, stamp tight beside it)
    "[&_table.document-sign-stamp-table]:my-3 [&_table.document-sign-stamp-table]:w-auto",
    "[&_table.document-sign-stamp-table]:max-w-full [&_table.document-sign-stamp-table]:border-0",
    "[&_table.document-sign-stamp-table]:border-collapse",
    "[&_table.document-sign-stamp-table_td]:border-0 [&_table.document-sign-stamp-table_td]:bg-transparent",
    "[&_table.document-sign-stamp-table_td]:p-0 [&_table.document-sign-stamp-table_td]:align-top",
    "[&_table.document-sign-stamp-table_td:first-child]:pr-3",
    "[&_table.document-sign-stamp-table_img]:my-0 [&_table.document-sign-stamp-table_img]:block",
    "[&_table.document-sign-stamp-table_p]:my-0 [&_table.document-sign-stamp-table_p]:mt-1",
    "[&_table.document-sign-stamp-table_p]:leading-snug",
    "[&_.document-sign-stamp-row]:my-3 [&_.document-sign-stamp-row]:flex",
    "[&_.document-sign-stamp-row]:items-start [&_.document-sign-stamp-row]:gap-3",
    "[&_.document-sign-stamp-row]:w-auto [&_.document-sign-col]:flex-none",
    "[&_.document-sign-stamp-row_img]:my-0 [&_.document-sign-stamp-row_img]:block",
    "[&_.document-sign-col_p]:my-0 [&_.document-sign-col_p]:mt-1 [&_.document-sign-col_p]:leading-snug",
    // TipTap float wrappers (legacy) — keep margins off floated imgs
    "[&_.document-image-float]:my-0 [&_.document-image-float_img]:my-0",
    "[&_.document-image-float_img]:max-w-full [&_.document-image-float_img]:h-auto",
    "[&_img.document-student-signature]:inline-block [&_img.document-student-signature]:max-w-[180px] [&_img.document-student-signature]:h-auto",
    "[&_.document-requirements-checklist]:inline-block [&_.document-requirements-checklist]:max-w-full",
    "[&_.document-requirements-checklist]:text-left [&_.document-requirements-checklist]:align-top",
    "[&_.document-requirements-checklist]:font-sans",
    "[&_.requirement-checklist-row]:items-start [&_.requirement-checklist-row]:gap-1 [&_.requirement-checklist-row]:py-0.5",
    "[&_.requirement-checkbox]:shrink-0",
    "[&_.document-page-break]:relative [&_.document-page-break]:my-0 [&_.document-page-break]:min-h-[26px]",
    "[&_.document-page-break]:py-0 [&_.document-page-break]:border-0 [&_.document-page-break]:bg-transparent",
    "[&_.document-page-break-badge]:absolute [&_.document-page-break-badge]:top-0 [&_.document-page-break-badge]:left-1/2",
    "[&_.document-page-break-badge]:z-30 [&_.document-page-break-badge]:-translate-x-1/2",
    "[&_.document-page-break-badge]:flex [&_.document-page-break-badge]:items-center",
    "[&_.document-page-break-badge]:gap-2 [&_.document-page-break-badge]:rounded-full",
    "[&_.document-page-break-badge]:border [&_.document-page-break-badge]:border-dashed",
    "[&_.document-page-break-badge]:border-slate-300 [&_.document-page-break-badge]:bg-slate-100/90",
    "[&_.document-page-break-badge]:px-3 [&_.document-page-break-badge]:py-1",
    "[&_.document-page-break-badge]:whitespace-nowrap [&_.document-page-break-badge]:shadow-sm",
    "[&_.document-page-break-badge-text]:text-xs [&_.document-page-break-badge-text]:font-semibold",
    "[&_.document-page-break-badge-text]:uppercase [&_.document-page-break-badge-text]:tracking-wide",
    "[&_.document-page-break-badge-text]:text-slate-500",
    "[&_.document-page-break-action]:cursor-pointer [&_.document-page-break-action]:select-none",
    "[&_.document-page-break-action]:rounded-full [&_.document-page-break-action]:px-2",
    "[&_.document-page-break-action]:py-0.5 [&_.document-page-break-action]:text-[10px]",
    "[&_.document-page-break-action]:font-semibold [&_.document-page-break-action]:text-slate-600",
    "[&_.document-page-break-action:hover]:bg-white [&_.document-page-break-action:hover]:text-rose-600",
    "[&_.document-page-break-action:hover]:shadow-sm"
)

/** Minimum body height for a single static preview / print page slice. */
export const A4_DOCUMENT_PAGE_BODY_CLASS = cn(A4_DOCUMENT_CONTENT_CLASS, "min-h-[calc(297mm-40mm)]")

export const A4_DOCUMENT_SHEET_WRAPPER_CLASS = cn(
    "flex justify-center overflow-x-auto rounded-lg border border-border bg-[#eef1f5] py-8 px-4"
)

export const DEFAULT_PLACEHOLDER_LOGO_SRC = "/favicon.png"
export const PLACEHOLDER_LOGO_SIZE_PX = 500
export const DEFAULT_CENTER_LOGO_WIDTH = 120

export const DEFAULT_DOCUMENT_HEADING_TEXT = "Document Title"

export function buildDocumentHeadingBlock(title = DEFAULT_DOCUMENT_HEADING_TEXT): string {
    return `<h1 class="${DOCUMENT_MAIN_HEADING_CLASS}" style="text-align: center;">${title}</h1>`
}

export const DEFAULT_TEMPLATE_BODY_HTML = `${buildDocumentHeadingBlock()}<p></p>`

/** Inline CSS for multi-page offer letter HTML / PDF rendering. */
export const A4_DOCUMENT_PRINT_STYLES = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
        margin: 0;
        padding: 24px 12px;
        background: #f3f4f6;
        font-family: Georgia, "Times New Roman", serif;
        color: #111827;
    }
    .letter-shell {
        display: flex;
        flex-direction: column;
        gap: 16px;
        align-items: center;
    }
    .a4-page {
        position: relative;
        width: 794px;
        height: 1123px;
        overflow: hidden;
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 6px 36px rgba(0, 0, 0, 0.1);
    }
    .a4-page .page-inner {
        position: relative;
        z-index: 1;
        width: 100%;
        height: 100%;
        padding: 20mm 15mm;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }
    .document-template-header {
        margin-bottom: 16px;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 12px;
        flex-shrink: 0;
    }
    .document-template-header-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        gap: 16px;
    }
    .document-template-header-brand {
        display: flex;
        align-items: center;
        flex: 0 1 auto;
    }
    .document-template-header-logo {
        max-height: 72px;
        width: auto;
        object-fit: contain;
    }
    .document-template-header-contact,
    .document-template-header [data-header-contact] {
        margin: 0 0 0 auto;
        flex: 0 1 auto;
        text-align: right;
        font-size: 10px;
        font-weight: 500;
        font-family: Arial, Helvetica, sans-serif;
        color: #8E9BB0 !important;
        line-height: 1.4;
        white-space: nowrap;
    }
    .document-template-footer {
        margin-top: auto;
        border-top: 1px solid #e5e7eb;
        padding-top: 12px;
        flex-shrink: 0;
    }
    .a4-page .page-body {
        position: relative;
        z-index: 1;
        width: 100%;
        flex: 1;
        min-height: 0;
        overflow: hidden;
    }
    .${DOCUMENT_PAGE_WATERMARK_CLASS} {
        position: absolute;
        inset: 0;
        z-index: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
    }
    .${DOCUMENT_PAGE_WATERMARK_CLASS} img {
        width: var(--watermark-size, ${PLACEHOLDER_LOGO_SIZE_PX}px);
        height: var(--watermark-size, ${PLACEHOLDER_LOGO_SIZE_PX}px);
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        opacity: var(--watermark-opacity, 0.12);
    }
    img { max-width: 100%; height: auto; }
    .document-image-float { line-height: 0; }
    .document-image-float img { margin: 0; max-width: 100%; height: auto; }
    .document-sign-stamp-row {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin: 12px 0;
        width: auto;
        max-width: 100%;
    }
    .document-sign-col { flex: 0 0 auto; max-width: 55%; }
    .document-sign-col img,
    .document-stamp-col img { display: block; margin: 0; max-width: 100%; height: auto; }
    .document-sign-col p { margin: 4px 0 0; line-height: 1.35; }
    .document-stamp-col { flex: 0 0 auto; }
    table.document-sign-stamp-table {
        width: auto !important;
        max-width: 100%;
        border: none !important;
        border-collapse: collapse;
        margin: 12px 0;
    }
    table.document-sign-stamp-table td {
        border: none !important;
        background: transparent !important;
        vertical-align: top;
        padding: 0;
    }
    table.document-sign-stamp-table td:first-child { padding-right: 12px; }
    table.document-sign-stamp-table img { display: block; margin: 0; max-width: 100%; height: auto; }
    table.document-sign-stamp-table p { margin: 4px 0 0; line-height: 1.35; }
    table { width: 100%; border-collapse: collapse; }
    td, th { border: 1px solid #e5e7eb; padding: 8px; }
    .document-requirements-checklist {
        display: inline-block;
        text-align: left;
        vertical-align: top;
        max-width: 100%;
    }
    .requirement-checklist-row {
        display: flex;
        align-items: flex-start;
        gap: 4px;
        padding: 2px 0;
    }
    .template-aligned-block {
        display: inline-block;
        text-align: left;
        vertical-align: top;
        max-width: 100%;
    }
    @media print {
        body { background: white; padding: 0; }
        .a4-page { box-shadow: none; border-radius: 0; }
        .letter-shell { gap: 0; }
    }
`

export const DOCUMENT_IMAGE_FLOAT_CLASS = "document-image-float"
export const DOCUMENT_SIGN_STAMP_ROW_CLASS = "document-sign-stamp-row"
export const DOCUMENT_SIGN_STAMP_TABLE_CLASS = "document-sign-stamp-table"
export const DOCUMENT_SIGN_COL_CLASS = "document-sign-col"
export const DOCUMENT_STAMP_COL_CLASS = "document-stamp-col"

/**
 * Prepares template body HTML for static preview / print / PDF so it matches
 * the intended letter layout (especially signature + stamp).
 */
export function prepareDocumentBodyHtmlForStaticRender(html: string): string {
    return hydrateDocumentImageLayoutHtml(layoutDocumentSignatureStampBlocks(html))
}

/**
 * Rewrites the common TipTap pattern:
 *   <p><img signature float:left/><img stamp float:right/></p>
 *   <p>Name</p><p>Title</p>
 * into a compact row: signature+name on the left, stamp tight beside it
 * (no page-wide gap from float:right).
 */
export function layoutDocumentSignatureStampBlocks(html: string): string {
    if (!html || !html.includes("<img")) {
        return html
    }

    let output = ""
    let cursor = 0

    while (cursor < html.length) {
        const pStart = findNextParagraphStart(html, cursor)
        if (pStart === -1) {
            output += html.slice(cursor)
            break
        }

        output += html.slice(cursor, pStart)
        const pEnd = findMatchingCloseTag(html, pStart, "p")
        if (pEnd === -1) {
            output += html.slice(pStart)
            break
        }

        const paragraphHtml = html.slice(pStart, pEnd)
        const images = extractImageTags(paragraphHtml)

        if (images.length !== 2) {
            output += paragraphHtml
            cursor = pEnd
            continue
        }

        // Collect trailing empty paragraphs + up to 2 short name/title lines.
        let scan = pEnd
        const nameParagraphs: string[] = []

        while (scan < html.length) {
            const nextStart = findNextParagraphStart(html, scan)
            if (nextStart === -1) break

            // Only absorb paragraphs that immediately follow (whitespace only between).
            const between = html.slice(scan, nextStart)
            if (between.replace(/\s+/g, "").length > 0) break

            const nextEnd = findMatchingCloseTag(html, nextStart, "p")
            if (nextEnd === -1) break

            const nextHtml = html.slice(nextStart, nextEnd)
            const nextImages = extractImageTags(nextHtml)
            if (nextImages.length > 0) break

            const text = stripHtmlToText(nextHtml).trim()
            if (!text) {
                // Skip empty spacer paragraphs between images and the name.
                scan = nextEnd
                continue
            }

            if (!isSignatureNameLine(text) || nameParagraphs.length >= 2) {
                break
            }

            nameParagraphs.push(nextHtml)
            scan = nextEnd
        }

        if (nameParagraphs.length === 0) {
            // Still collapse float:left + float:right into a tight side-by-side row.
            output += buildSignStampRowHtml(images[0], images[1], [])
            cursor = pEnd
            continue
        }

        output += buildSignStampRowHtml(images[0], images[1], nameParagraphs)
        cursor = scan
    }

    return output
}

function buildSignStampRowHtml(
    signatureImgTag: string,
    stampImgTag: string,
    nameParagraphs: string[]
): string {
    const signatureImg = cleanImageTagForStaticLayout(signatureImgTag)
    const stampImg = cleanImageTagForStaticLayout(stampImgTag)
    const nameHtml = nameParagraphs.join("")

    // Use a borderless table so TipTap can round-trip the layout in the editor
    // (arbitrary div wrappers are often stripped by the schema).
    return (
        `<table class="${DOCUMENT_SIGN_STAMP_TABLE_CLASS}"` +
        ` style="width:auto;max-width:100%;border:none;border-collapse:collapse;margin:12px 0;">` +
        `<tbody><tr>` +
        `<td style="border:none;vertical-align:top;padding:0 12px 0 0;background:transparent;">` +
        `${signatureImg}${nameHtml}` +
        `</td>` +
        `<td style="border:none;vertical-align:top;padding:0;background:transparent;">` +
        `${stampImg}` +
        `</td>` +
        `</tr></tbody></table>`
    )
}

function cleanImageTagForStaticLayout(imgTag: string): string {
    const rawAttrs = imgTag.slice(4, imgTag.trimEnd().endsWith("/>") ? -2 : -1)
    const containerStyle = readHtmlAttribute(rawAttrs, "containerstyle")
    const widthAttr = readHtmlAttribute(rawAttrs, "width")

    let attrs = rawAttrs
        .replace(/\s*wrapperstyle\s*=\s*(?:"[^"]*"|'[^']*')/gi, "")
        .replace(/\s*containerstyle\s*=\s*(?:"[^"]*"|'[^']*')/gi, "")

    const styleParts: string[] = ["display:block", "margin:0", "height:auto", "max-width:100%"]
    if (containerStyle) {
        const cleaned = stripEditorOnlyImageStyles(containerStyle)
            .split(";")
            .map((part) => part.trim())
            .filter(Boolean)
            .filter((part) => {
                const prop = part.split(":")[0]?.trim().toLowerCase()
                // Drop float/display from container — row flex owns layout.
                return prop !== "float" && prop !== "display" && prop !== "cursor"
            })
        styleParts.push(...cleaned)
    } else if (widthAttr) {
        styleParts.push(`width:${widthAttr}px`)
    }

    attrs = mergeHtmlStyleAttribute(attrs, styleParts.join("; "))
    return `<img${attrs}>`
}

function isSignatureNameLine(text: string): boolean {
    if (text.length > 80) return false
    const lower = text.toLowerCase()
    return (
        lower.includes("wittberg") ||
        lower.includes("prorektor") ||
        lower.includes("prorector") ||
        lower.includes("prof.") ||
        /^[A-ZÄÖÜ][^.!?]{2,60}$/u.test(text)
    )
}

function stripHtmlToText(html: string): string {
    return html
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/\s+/g, " ")
        .trim()
}

function findNextParagraphStart(html: string, from: number): number {
    const match = html.slice(from).match(/<p\b/i)
    return match && typeof match.index === "number" ? from + match.index : -1
}

function findMatchingCloseTag(html: string, openStart: number, tagName: string): number {
    const openMatch = html.slice(openStart).match(new RegExp(`^<${tagName}\\b[^>]*>`, "i"))
    if (!openMatch) return -1

    const contentStart = openStart + openMatch[0].length
    const closeTag = `</${tagName}>`
    const closeIndex = html.toLowerCase().indexOf(closeTag.toLowerCase(), contentStart)
    if (closeIndex === -1) return -1
    return closeIndex + closeTag.length
}

function extractImageTags(html: string): string[] {
    const images: string[] = []
    let cursor = 0

    while (cursor < html.length) {
        const imgStart = html.toLowerCase().indexOf("<img", cursor)
        if (imgStart === -1) break
        const imgEnd = findHtmlTagEnd(html, imgStart)
        if (imgEnd === -1) break
        images.push(html.slice(imgStart, imgEnd + 1))
        cursor = imgEnd + 1
    }

    return images
}

/**
 * TipTap's resize-image extension stores float/size layout in custom
 * `wrapperstyle` / `containerstyle` attributes. Those only become real CSS
 * inside the editor NodeView — static HTML (preview, print, PDF) ignores them.
 * This rewrites remaining floated images after signature/stamp normalization.
 *
 * Uses a quote-aware scan because large data-URI images may contain `>` inside
 * the quoted `src` attribute (naive `/[^>]*>/` regexes miss those tags).
 */
export function hydrateDocumentImageLayoutHtml(html: string): string {
    if (!html || (!html.includes("wrapperstyle") && !html.includes("containerstyle"))) {
        return html
    }

    let output = ""
    let cursor = 0

    while (cursor < html.length) {
        const imgStart = html.indexOf("<img", cursor)
        if (imgStart === -1) {
            output += html.slice(cursor)
            break
        }

        // Case-insensitive guard for uncommon `<IMG` tags.
        const tagOpen = html.slice(imgStart, imgStart + 4)
        if (!/^<img/i.test(tagOpen)) {
            output += html.slice(cursor, imgStart + 4)
            cursor = imgStart + 4
            continue
        }

        output += html.slice(cursor, imgStart)
        const imgEnd = findHtmlTagEnd(html, imgStart)
        if (imgEnd === -1) {
            output += html.slice(imgStart)
            break
        }

        const fullTag = html.slice(imgStart, imgEnd + 1)
        const rawAttrs = fullTag.slice(4, fullTag.endsWith("/>") ? -2 : -1)
        output += hydrateSingleImageTag(rawAttrs)
        cursor = imgEnd + 1
    }

    return output
}

function hydrateSingleImageTag(rawAttrs: string): string {
    const wrapperStyle = readHtmlAttribute(rawAttrs, "wrapperstyle")
    const containerStyle = readHtmlAttribute(rawAttrs, "containerstyle")

    if (!wrapperStyle && !containerStyle) {
        return `<img${rawAttrs}>`
    }

    let attrs = rawAttrs
        .replace(/\s*wrapperstyle\s*=\s*(?:"[^"]*"|'[^']*')/gi, "")
        .replace(/\s*containerstyle\s*=\s*(?:"[^"]*"|'[^']*')/gi, "")

    if (containerStyle) {
        attrs = mergeHtmlStyleAttribute(attrs, stripEditorOnlyImageStyles(containerStyle))
    }

    const imgTag = `<img${attrs}>`
    if (!wrapperStyle) {
        return imgTag
    }

    const safeWrapperStyle = stripEditorOnlyImageStyles(wrapperStyle)
    return `<span class="${DOCUMENT_IMAGE_FLOAT_CLASS}" style="${escapeHtmlAttributeValue(safeWrapperStyle)}">${imgTag}</span>`
}

/** Finds the closing `>` of an HTML tag, respecting quoted attribute values. */
function findHtmlTagEnd(html: string, tagStart: number): number {
    let inQuote: '"' | "'" | null = null

    for (let index = tagStart + 1; index < html.length; index += 1) {
        const char = html[index]
        if (inQuote) {
            if (char === inQuote) {
                inQuote = null
            }
            continue
        }
        if (char === '"' || char === "'") {
            inQuote = char
            continue
        }
        if (char === ">") {
            return index
        }
    }

    return -1
}

function readHtmlAttribute(attrs: string, name: string): string | null {
    const match = attrs.match(
        new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i")
    )
    return match ? (match[1] ?? match[2] ?? null) : null
}

function mergeHtmlStyleAttribute(attrs: string, extraStyle: string): string {
    const trimmedExtra = extraStyle.trim().replace(/;?\s*$/, "")
    if (!trimmedExtra) {
        return attrs
    }

    const existing = readHtmlAttribute(attrs, "style")
    if (existing) {
        const merged = `${existing.trim().replace(/;?\s*$/, "")}; ${trimmedExtra};`
        return attrs.replace(
            /\s*style\s*=\s*(?:"[^"]*"|'[^']*')/i,
            ` style="${escapeHtmlAttributeValue(merged)}"`
        )
    }

    return `${attrs} style="${escapeHtmlAttributeValue(`${trimmedExtra};`)}"`
}

/** Drop editor-only chrome (resize cursor) from persisted TipTap style attrs. */
function stripEditorOnlyImageStyles(style: string): string {
    return style
        .split(";")
        .map((part) => part.trim())
        .filter((part) => {
            if (!part) return false
            const property = part.split(":")[0]?.trim().toLowerCase()
            return property !== "cursor"
        })
        .join("; ")
}

function escapeHtmlAttributeValue(value: string): string {
    return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;")
}

export function hasCenterLogo(html: string): boolean {
    return (
        html.includes(DOCUMENT_CENTER_LOGO_CLASS) ||
        html.includes(DOCUMENT_LOGO_CLASS) ||
        html.includes("document-default-icon")
    )
}

export function buildImageHtml(
    url: string,
    options: {
        className: string
        alt: string
        width?: number
    }
): string {
    const widthAttr = options.width ? ` width="${options.width}"` : ""
    return `<img src="${url}" alt="${options.alt}" class="${options.className}"${widthAttr} data-keep-ratio="true" />`
}

export function buildLogoImageHtml(
    url: string,
    width = DEFAULT_CENTER_LOGO_WIDTH,
    className = DOCUMENT_LOGO_CLASS
) {
    return buildImageHtml(url, {
        className: `${className} ${DOCUMENT_IMAGE_CLASS}`.trim(),
        alt: "Logo",
        width,
    })
}

export function buildLogoLineBlock(options?: {
    align?: "left" | "center" | "right"
    logos?: Array<{ url: string; width?: number }>
}) {
    const align = options?.align ?? "left"
    const logos = options?.logos ?? []
    const logoHtml = logos
        .map((logo) => buildLogoImageHtml(logo.url, logo.width ?? DEFAULT_CENTER_LOGO_WIDTH))
        .join("")

    return `<p class="${DOCUMENT_LOGO_LINE_CLASS}" style="text-align: ${align};">${logoHtml}</p>`
}

export function buildCenterLogoBlock(url: string, width = DEFAULT_CENTER_LOGO_WIDTH): string {
    return buildLogoLineBlock({
        align: "center",
        logos: [{ url, width }],
    })
}

export function buildHeaderImageBlock(url: string, width?: number) {
    return `<p style="text-align: center;">${buildImageHtml(url, {
        className: DOCUMENT_HEADER_IMAGE_CLASS,
        alt: "Document header",
        width,
    })}</p>`
}
