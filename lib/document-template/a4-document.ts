import { cn } from "@/lib/utils"

export const DOCUMENT_HEADER_IMAGE_CLASS = "document-header-image"
export const DOCUMENT_IMAGE_CLASS = "document-image"
export const DOCUMENT_CENTER_LOGO_CLASS = "document-center-logo"
export const DOCUMENT_MAIN_HEADING_CLASS = "document-main-heading"

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
    "relative mx-auto box-border bg-white shadow-[0_4px_24px_rgba(0,0,0,0.12)]",
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
    "[&_img.document-center-logo]:block [&_img.document-center-logo]:object-contain",
    "[&_img.document-image]:my-4 [&_img.document-image]:max-w-full [&_img.document-image]:h-auto",
    "[&_img.document-student-signature]:inline-block [&_img.document-student-signature]:max-w-[180px] [&_img.document-student-signature]:h-auto"
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

export function hasCenterLogo(html: string): boolean {
    return (
        html.includes(DOCUMENT_CENTER_LOGO_CLASS) ||
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

export function buildCenterLogoBlock(url: string, width = DEFAULT_CENTER_LOGO_WIDTH): string {
    return `<p style="text-align: center;">${buildImageHtml(url, {
        className: DOCUMENT_CENTER_LOGO_CLASS,
        alt: "Center logo",
        width,
    })}</p>`
}
