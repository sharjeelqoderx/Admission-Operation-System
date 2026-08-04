import { cn } from "@/lib/utils"

import { splitTemplateBodyIntoPages } from "@/lib/document-template/a4-document"

export const DOCUMENT_TEMPLATE_HEADER_CLASS = "document-template-header"
export const DOCUMENT_TEMPLATE_FOOTER_CLASS = "document-template-footer"
export const DOCUMENT_TEMPLATE_BODY_CLASS = "document-template-body"
export const DOCUMENT_TEMPLATE_HEADER_LOGO_CLASS = "document-template-header-logo"

const HEADER_BLOCK_REGEX = new RegExp(
    `<div\\s+class="${DOCUMENT_TEMPLATE_HEADER_CLASS}"[^>]*data-document-region="header"[^>]*>[\\s\\S]*?<\\/div>`,
    "i"
)
const FOOTER_BLOCK_REGEX = new RegExp(
    `<div\\s+class="${DOCUMENT_TEMPLATE_FOOTER_CLASS}"[^>]*data-document-region="footer"[^>]*>[\\s\\S]*?<\\/div>`,
    "i"
)
const BODY_WRAPPER_REGEX = new RegExp(
    `<div\\s+class="${DOCUMENT_TEMPLATE_BODY_CLASS}"[^>]*data-document-region="body"[^>]*>([\\s\\S]*?)<\\/div>`,
    "i"
)

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

export const DEFAULT_HEADER_FIELDS: DocumentTemplateHeaderFields = {
    logoUrl: "",
    contactText:
        "FHM // International Office // Ravensberger Str. 10 G // 33602 Bielefeld",
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
    "[&_.document-template-header-logo]:max-h-[72px] [&_.document-template-header-logo]:w-auto",
    "[&_.document-template-header-logo]:object-contain",
    "[&_.document-template-header-logo-placeholder]:inline-block [&_.document-template-header-logo-placeholder]:h-12",
    "[&_.document-template-header-logo-placeholder]:w-[120px] [&_.document-template-header-logo-placeholder]:rounded",
    "[&_.document-template-header-logo-placeholder]:border [&_.document-template-header-logo-placeholder]:border-dashed",
    "[&_.document-template-header-logo-placeholder]:border-border [&_.document-template-header-logo-placeholder]:bg-muted/30"
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

export function buildHeaderHtml(fields: DocumentTemplateHeaderFields): string {
    const logoBlock = fields.logoUrl.trim()
        ? `<img src="${escapeHtml(fields.logoUrl.trim())}" alt="University logo" class="${DOCUMENT_TEMPLATE_HEADER_LOGO_CLASS}" data-header-logo style="max-height:72px;width:auto;object-fit:contain;" />`
        : `<span class="document-template-header-logo-placeholder" data-header-logo aria-hidden="true"></span>`

    return `<div class="${DOCUMENT_TEMPLATE_HEADER_CLASS}" data-document-region="header">
  <table style="width:100%;border:none;border-collapse:collapse;">
    <tr>
      <td style="width:50%;vertical-align:top;border:none;padding:0;">${logoBlock}</td>
      <td style="width:50%;vertical-align:top;text-align:right;border:none;padding:0;font-size:11px;color:#374151;line-height:1.5;">
        <p data-header-contact style="margin:0;">${textToHtmlParagraph(fields.contactText)}</p>
      </td>
    </tr>
  </table>
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

    const logoMatch = normalized.match(/data-header-logo[^>]*src="([^"]*)"/i)
    const contactMatch = normalized.match(/data-header-contact[^>]*>([\s\S]*?)<\/p>/i)

    return {
        logoUrl: logoMatch?.[1]?.trim() ?? "",
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
    return HEADER_BLOCK_REGEX.test(html)
}

export function hasTemplateFooter(html: string): boolean {
    return FOOTER_BLOCK_REGEX.test(html)
}

export function parseDocumentLayout(fullHtml: string): DocumentTemplateLayout {
    const normalized = fullHtml.trim()
    if (!normalized) {
        return { headerHtml: null, bodyHtml: "", footerHtml: null }
    }

    let headerHtml: string | null = null
    let footerHtml: string | null = null
    let remaining = normalized

    const headerMatch = normalized.match(HEADER_BLOCK_REGEX)
    if (headerMatch) {
        headerHtml = headerMatch[0]
        remaining = remaining.replace(headerMatch[0], "").trim()
    }

    const footerMatch = remaining.match(FOOTER_BLOCK_REGEX)
    if (footerMatch) {
        footerHtml = footerMatch[0]
        remaining = remaining.replace(footerMatch[0], "").trim()
    }

    const bodyWrapperMatch = remaining.match(BODY_WRAPPER_REGEX)
    const bodyHtml = bodyWrapperMatch ? bodyWrapperMatch[1].trim() : remaining

    return { headerHtml, bodyHtml, footerHtml }
}

export function composeDocumentLayout(layout: DocumentTemplateLayout): string {
    const parts: string[] = []

    if (layout.headerHtml?.trim()) {
        parts.push(layout.headerHtml.trim())
    }

    const body = layout.bodyHtml.trim()
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
