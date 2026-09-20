import { cn } from "@/lib/utils"

import {
    splitTemplateBodyIntoPages,
    stripLeadingTrailingPageBreakMarkers,
} from "@/lib/document-template/a4-document"
import {
    getDefaultHeaderContactText,
    type TemplateLocale,
} from "@/lib/document-template/locale"

export const DOCUMENT_TEMPLATE_HEADER_CLASS = "document-template-header"
export const DOCUMENT_TEMPLATE_FOOTER_CLASS = "document-template-footer"
export const DOCUMENT_TEMPLATE_BODY_CLASS = "document-template-body"
export const DOCUMENT_TEMPLATE_HEADER_LOGO_CLASS = "document-template-header-logo"
export const DOCUMENT_TEMPLATE_HEADER_INNER_CLASS = "document-template-header-inner"
export const DOCUMENT_TEMPLATE_HEADER_BRAND_CLASS = "document-template-header-brand"
export const DOCUMENT_TEMPLATE_HEADER_CONTACT_CLASS = "document-template-header-contact"
export const DOCUMENT_TEMPLATE_HEADER_CONTACT_COLOR = "#7D89A6"
export const DOCUMENT_TEMPLATE_HEADER_LOGO_MAX_HEIGHT_PX = 52

const DOCUMENT_REGION_OPEN_TAG_REGEX = (
    className: string,
    region: "header" | "body" | "footer"
) =>
    new RegExp(
        `<div\\s+class="${className}"[^>]*data-document-region="${region}"[^>]*>`,
        "i"
    )

type DocumentRegionBlock = {
    fullBlock: string
    innerHtml: string
}

/** Matches the closing </div> for an opening tag, respecting nested divs. */
function findMatchingDivCloseIndex(html: string, contentStartIndex: number): number | null {
    let depth = 1
    let index = contentStartIndex
    const lower = html.toLowerCase()

    while (index < html.length && depth > 0) {
        const nextOpen = lower.indexOf("<div", index)
        const nextClose = lower.indexOf("</div>", index)

        if (nextClose === -1) {
            return null
        }

        if (nextOpen !== -1 && nextOpen < nextClose) {
            depth += 1
            index = nextOpen + 4
            continue
        }

        depth -= 1
        if (depth === 0) {
            return nextClose
        }

        index = nextClose + 6
    }

    return null
}

function extractDocumentRegionBlock(
    html: string,
    className: string,
    region: "header" | "body" | "footer"
): DocumentRegionBlock | null {
    const openMatch = DOCUMENT_REGION_OPEN_TAG_REGEX(className, region).exec(html)
    if (!openMatch || openMatch.index === undefined) {
        return null
    }

    const openTag = openMatch[0]
    const contentStartIndex = openMatch.index + openTag.length
    const closeStartIndex = findMatchingDivCloseIndex(html, contentStartIndex)
    if (closeStartIndex === null) {
        return null
    }

    const closeEndIndex = closeStartIndex + "</div>".length

    return {
        fullBlock: html.slice(openMatch.index, closeEndIndex),
        innerHtml: html.slice(contentStartIndex, closeStartIndex).trim(),
    }
}

export type DocumentTemplateLayout = {
    headerHtml: string | null
    bodyHtml: string
    footerHtml: string | null
}

export type DocumentTemplatePageSlice = {
    headerHtml: string | null
    bodyHtml: string
    footerHtml: string | null
}

export type DocumentTemplateHeaderFields = {
    logoUrl: string
    contactText: string
}

export type DocumentTemplateFooterFields = {
    column1: string
    column2: string
    column3: string
    column4: string
}

export const DEFAULT_HEADER_FIELDS: DocumentTemplateHeaderFields = getDefaultHeaderFields("en")

export function getDefaultHeaderFields(
    locale: TemplateLocale = "en"
): DocumentTemplateHeaderFields {
    return {
        logoUrl: "",
        contactText: getDefaultHeaderContactText(locale),
    }
}

export const DEFAULT_FOOTER_FIELDS: DocumentTemplateFooterFields = {
    column1:
        "Fachhochschule des Mittelstands (FHM) GmbH\nUniversity of Applied Sciences\nFHM Bielefeld, Ravensberger Str. 10 G\n33602 Bielefeld",
    column2:
        "Telefon +49 (0)521 966-55 110\ninternationaloffice@fh-mittelstand.de\nwww.fh-mittelstand.de",
    column3: "Geschäftsführung\nProf. Dr. Anne Dreier\nMichael H. Lutter",
    column4:
        "Amtsgericht Bielefeld\nHandelsregister: HRB 36858\nUst-IdNr.: DE212769930",
}

export const DOCUMENT_TEMPLATE_HEADER_FOOTER_STYLES = cn(
    "[&_.document-template-header]:mb-4 [&_.document-template-header]:border-b [&_.document-template-header]:border-border/60",
    "[&_.document-template-header]:pb-3",
    "[&_.document-template-footer]:mt-auto [&_.document-template-footer]:border-t [&_.document-template-footer]:border-border/60",
    "[&_.document-template-footer]:pt-3",
    "[&_.document-template-header-logo]:max-h-[52px] [&_.document-template-header-logo]:w-auto",
    "[&_.document-template-header-logo]:object-contain",
    "[&_.document-template-header-contact]:m-0 [&_.document-template-header-contact]:ml-auto",
    "[&_.document-template-header-contact]:shrink-0 [&_.document-template-header-contact]:self-center",
    "[&_.document-template-header-contact]:text-right",
    "[&_.document-template-header-contact]:text-[10px] [&_[data-header-contact]]:text-[10px]",
    "[&_.document-template-header-contact]:!text-[#7D89A6] [&_[data-header-contact]]:!text-[#7D89A6]",
    "[&_.document-template-header-contact]:font-normal [&_.document-template-header-contact]:leading-snug",
    "[&_.document-template-header-contact]:font-[Arial,Helvetica,sans-serif]",
    "[&_.document-template-header-inner]:flex [&_.document-template-header-inner]:w-full",
    "[&_.document-template-header-inner]:items-center [&_.document-template-header-inner]:justify-between",
    "[&_.document-template-header-inner]:gap-4",
    "[&_.document-template-header-brand]:flex [&_.document-template-header-brand]:min-h-[52px]",
    "[&_.document-template-header-brand]:items-center [&_.document-template-header-brand]:shrink-0",
    "[&_.document-template-header-logo-placeholder]:inline-block [&_.document-template-header-logo-placeholder]:h-[52px]",
    "[&_.document-template-header-logo-placeholder]:w-[140px] [&_.document-template-header-logo-placeholder]:rounded-sm",
    "[&_.document-template-header-logo-placeholder]:border [&_.document-template-header-logo-placeholder]:border-dashed",
    "[&_.document-template-header-logo-placeholder]:border-border/70 [&_.document-template-header-logo-placeholder]:bg-transparent",
    "[&_.document-template-footer_table]:w-full",
    "[&_[data-footer-text]]:m-0 [&_[data-footer-text]]:text-[9px]",
    "[&_[data-footer-text]]:leading-[1.4] [&_[data-footer-text]]:text-[#374151]",
    "[&_[data-footer-text]]:font-[Arial,Helvetica,sans-serif]"
)

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
}

function textToHtmlParagraph(value: string): string {
    return escapeHtml(value).replace(/\n/g, "<br />")
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

export function buildDefaultHeaderHtml(): string {
    return buildHeaderHtml(DEFAULT_HEADER_FIELDS)
}

export function buildDefaultFooterHtml(): string {
    return buildFooterHtml(DEFAULT_FOOTER_FIELDS)
}

function extractHeaderLogoUrl(html: string): string {
    const logoElementMatch = html.match(/<img\b[^>]*\bdata-header-logo\b[^>]*>/i)
    if (!logoElementMatch) {
        return ""
    }

    const srcMatch = logoElementMatch[0].match(/\bsrc="([^"]*)"/i)
    return srcMatch?.[1]?.trim() ?? ""
}

export function buildHeaderHtml(fields: DocumentTemplateHeaderFields): string {
    const logoBlock = fields.logoUrl.trim()
        ? `<img data-header-logo src="${escapeHtml(fields.logoUrl.trim())}" alt="University logo" class="${DOCUMENT_TEMPLATE_HEADER_LOGO_CLASS}" style="max-height:${DOCUMENT_TEMPLATE_HEADER_LOGO_MAX_HEIGHT_PX}px;width:auto;object-fit:contain;display:block;" />`
        : `<span class="document-template-header-logo-placeholder" data-header-logo aria-hidden="true"></span>`

    return `<div class="${DOCUMENT_TEMPLATE_HEADER_CLASS}" data-document-region="header">
  <div class="${DOCUMENT_TEMPLATE_HEADER_INNER_CLASS}" style="display:flex;align-items:center;justify-content:space-between;width:100%;gap:16px;">
    <div class="${DOCUMENT_TEMPLATE_HEADER_BRAND_CLASS}" style="display:flex;align-items:center;flex:0 0 auto;min-height:${DOCUMENT_TEMPLATE_HEADER_LOGO_MAX_HEIGHT_PX}px;">${logoBlock}</div>
    <span data-header-contact class="${DOCUMENT_TEMPLATE_HEADER_CONTACT_CLASS}" style="display:block;margin:0;margin-left:auto;flex:0 1 auto;align-self:center;text-align:right;font-size:10px;font-weight:400;font-family:Arial,Helvetica,sans-serif;color:${DOCUMENT_TEMPLATE_HEADER_CONTACT_COLOR};line-height:1.4;white-space:nowrap;">${textToHtmlParagraph(fields.contactText)}</span>
  </div>
</div>`
}

export function buildFooterHtml(fields: DocumentTemplateFooterFields): string {
    const columns = [
        fields.column1,
        fields.column2,
        fields.column3,
        fields.column4,
    ]

    const cells = columns
        .map(
            (column, index) =>
                `<td data-footer-col="${index + 1}" style="width:25%;vertical-align:top;border:none;padding:4px ${index === 3 ? "0 0 4px 8px" : index === 0 ? "4px 8px 4px 0" : "4px 8px"};font-size:9px;color:#374151;line-height:1.4;">
        <p data-footer-text style="margin:0;">${textToHtmlParagraph(column)}</p>
      </td>`
        )
        .join("")

    return `<div class="${DOCUMENT_TEMPLATE_FOOTER_CLASS}" data-document-region="footer">
  <table style="width:100%;border:none;border-collapse:collapse;">
    <tr>${cells}</tr>
  </table>
</div>`
}

export function parseHeaderHtml(html: string): DocumentTemplateHeaderFields | null {
    const normalized = html.trim()
    if (!normalized) return null

    const contactMatch = normalized.match(
        /data-header-contact[^>]*>([\s\S]*?)<\/(?:p|span)>/i
    )

    return {
        logoUrl: extractHeaderLogoUrl(normalized),
        contactText: contactMatch ? stripHtml(contactMatch[1]) : DEFAULT_HEADER_FIELDS.contactText,
    }
}

export function parseFooterHtml(html: string): DocumentTemplateFooterFields | null {
    const normalized = html.trim()
    if (!normalized) return null

    const columns: string[] = []

    for (let index = 1; index <= 4; index += 1) {
        const match = normalized.match(
            new RegExp(`data-footer-col="${index}"[^>]*>[\\s\\S]*?data-footer-text[^>]*>([\\s\\S]*?)<\\/p>`, "i")
        )
        columns.push(match ? stripHtml(match[1]) : "")
    }

    return {
        column1: columns[0] || DEFAULT_FOOTER_FIELDS.column1,
        column2: columns[1] || DEFAULT_FOOTER_FIELDS.column2,
        column3: columns[2] || DEFAULT_FOOTER_FIELDS.column3,
        column4: columns[3] || DEFAULT_FOOTER_FIELDS.column4,
    }
}

export function hasTemplateHeader(html: string): boolean {
    return (
        extractDocumentRegionBlock(html, DOCUMENT_TEMPLATE_HEADER_CLASS, "header") !== null
    )
}

export function hasTemplateFooter(html: string): boolean {
    return (
        extractDocumentRegionBlock(html, DOCUMENT_TEMPLATE_FOOTER_CLASS, "footer") !== null
    )
}

export function parseDocumentLayout(fullHtml: string): DocumentTemplateLayout {
    const normalized = fullHtml.trim()
    if (!normalized) {
        return { headerHtml: null, bodyHtml: "", footerHtml: null }
    }

    let headerHtml: string | null = null
    let footerHtml: string | null = null
    let remaining = normalized

    const headerBlock = extractDocumentRegionBlock(
        remaining,
        DOCUMENT_TEMPLATE_HEADER_CLASS,
        "header"
    )
    if (headerBlock) {
        headerHtml = headerBlock.fullBlock
        remaining = remaining.replace(headerBlock.fullBlock, "").trim()
    }

    const footerBlock = extractDocumentRegionBlock(
        remaining,
        DOCUMENT_TEMPLATE_FOOTER_CLASS,
        "footer"
    )
    if (footerBlock) {
        footerHtml = footerBlock.fullBlock
        remaining = remaining.replace(footerBlock.fullBlock, "").trim()
    }

    const bodyBlock = extractDocumentRegionBlock(
        remaining,
        DOCUMENT_TEMPLATE_BODY_CLASS,
        "body"
    )
    const bodyHtml = stripLeadingTrailingPageBreakMarkers(
        bodyBlock ? bodyBlock.innerHtml : remaining
    )

    if (headerHtml) {
        const headerFields = parseHeaderHtml(headerHtml)
        if (headerFields) {
            headerHtml = buildHeaderHtml(headerFields)
        }
    }

    return { headerHtml, bodyHtml, footerHtml }
}

export function composeDocumentLayout(layout: DocumentTemplateLayout): string {
    const parts: string[] = []

    if (layout.headerHtml?.trim()) {
        parts.push(layout.headerHtml.trim())
    }

    const body = stripLeadingTrailingPageBreakMarkers(layout.bodyHtml)
    if (body) {
        parts.push(
            `<div class="${DOCUMENT_TEMPLATE_BODY_CLASS}" data-document-region="body">${body}</div>`
        )
    }

    if (layout.footerHtml?.trim()) {
        parts.push(layout.footerHtml.trim())
    }

    return parts.join("\n")
}

export function splitTemplateLayoutIntoPages(fullHtml: string): DocumentTemplatePageSlice[] {
    const layout = parseDocumentLayout(fullHtml)
    const bodyPages = splitTemplateBodyIntoPages(layout.bodyHtml)

    return bodyPages.map((bodyHtml) => ({
        headerHtml: layout.headerHtml,
        bodyHtml,
        footerHtml: layout.footerHtml,
    }))
}
