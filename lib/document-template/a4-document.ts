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

export function splitTemplateBodyIntoPages(bodyHtml: string): string[] {
    const normalized = bodyHtml.trim()
    if (!normalized) return [""]

    const parts = normalized
        .split(DOCUMENT_PAGE_BREAK_MARKER_REGEX)
        .map((part) => part.trim())
        .filter((part) => part.length > 0)

    return parts.length > 0 ? parts : [normalized]
}

export function buildDocumentPageWatermarkHtml(
    logoSrc = DEFAULT_PLACEHOLDER_LOGO_SRC,
    sizePx = PLACEHOLDER_LOGO_SIZE_PX
): string {
    return `<div class="${DOCUMENT_PAGE_WATERMARK_CLASS}" aria-hidden="true"><img src="${logoSrc}" alt="" width="${sizePx}" height="${sizePx}" /></div>`
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

/** A4 page shell — 210mm × 297mm with standard document margins. */
export const A4_DOCUMENT_PAGE_CLASS = cn(
    "a4-document-page",
    "relative mx-auto box-border overflow-hidden bg-white shadow-[0_4px_24px_rgba(0,0,0,0.12)]",
    "w-[210mm] min-h-[297mm] max-w-full",
    "px-[15mm] py-[20mm]"
)

export const A4_DOCUMENT_CONTENT_CLASS = cn(
    "prose prose-sm max-w-none w-full min-h-[calc(297mm-40mm)]",
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
    "[&_img.document-student-signature]:inline-block [&_img.document-student-signature]:max-w-[180px] [&_img.document-student-signature]:h-auto",
    "[&_.document-requirements-checklist]:font-sans",
    "[&_.requirement-checklist-row]:items-start",
    "[&_.requirement-checkbox]:shrink-0",
    "[&_.document-page-break]:relative [&_.document-page-break]:my-8 [&_.document-page-break]:py-3",
    "[&_.document-page-break]:border-y-2 [&_.document-page-break]:border-dashed [&_.document-page-break]:border-slate-300",
    "[&_.document-page-break]:bg-slate-100/80 [&_.document-page-break]:text-center",
    "[&_.document-page-break-label]:text-xs [&_.document-page-break-label]:font-semibold",
    "[&_.document-page-break-label]:uppercase [&_.document-page-break-label]:tracking-wide",
    "[&_.document-page-break-label]:text-slate-500"
)

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
    }
    .a4-page .page-body {
        position: relative;
        z-index: 1;
        width: 100%;
        height: 100%;
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
        width: ${PLACEHOLDER_LOGO_SIZE_PX}px;
        height: ${PLACEHOLDER_LOGO_SIZE_PX}px;
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        opacity: 0.12;
    }
    img { max-width: 100%; height: auto; }
    table { width: 100%; border-collapse: collapse; }
    td, th { border: 1px solid #e5e7eb; padding: 8px; }
    @media print {
        body { background: white; padding: 0; }
        .a4-page { box-shadow: none; border-radius: 0; }
        .letter-shell { gap: 0; }
    }
`

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
