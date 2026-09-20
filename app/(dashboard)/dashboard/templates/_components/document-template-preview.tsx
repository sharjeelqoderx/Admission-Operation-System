"use client"

import { memo, useMemo } from "react"
import { createPortal } from "react-dom"
import { Typography } from "@/components/shared/Typography"
import { useClientReady } from "@/hooks/useClientReady"
import { DocumentPageWatermark } from "./document-center-logo-placeholder"
import {
    A4_DOCUMENT_CONTENT_CLASS,
    A4_DOCUMENT_GROWING_PAGE_CLASS,
    A4_DOCUMENT_MULTI_PAGE_STACK_CLASS,
    A4_DOCUMENT_SHEET_WRAPPER_CLASS,
    prepareDocumentBodyHtmlForStaticRender,
} from "@/lib/document-template/a4-document"
import {
    DOCUMENT_TEMPLATE_HEADER_FOOTER_STYLES,
    splitTemplateLayoutIntoPages,
    type DocumentTemplatePageSlice,
} from "@/lib/document-template/header-footer"
import {
    renderTemplateHtml,
    buildTemplatePreviewSampleData,
} from "@/lib/document-template/variables"
import type { DocumentTemplateDates } from "@/lib/document-template/date-variables"
import type { DocumentTemplateWatermark } from "@/lib/document-template/watermark"
import type { TemplateLocale } from "@/types/schemas/document-template"
import { cn } from "@/lib/utils"

type DocumentTemplatePreviewProps = {
    title: string
    bodyHtml: string
    locale?: TemplateLocale
    templateDates?: DocumentTemplateDates | null
    watermark?: DocumentTemplateWatermark | null
    useSampleData?: boolean
    className?: string
    printable?: boolean
}

export const DocumentTemplatePreview = memo(function DocumentTemplatePreview({
    title,
    bodyHtml,
    locale = "en",
    templateDates = null,
    watermark = null,
    useSampleData = true,
    className,
    printable = false,
}: DocumentTemplatePreviewProps) {
    const isClientReady = useClientReady()

    const renderedHtml = useMemo(
        () => {
            const withVariables = useSampleData
                ? renderTemplateHtml(bodyHtml, buildTemplatePreviewSampleData(locale, templateDates))
                : bodyHtml
            return prepareDocumentBodyHtmlForStaticRender(withVariables)
        },
        [bodyHtml, locale, templateDates, useSampleData]
    )

    // Same page boundaries as the editor: manual page-break markers only.
    // Do not auto-split by height — that was creating extra pages and shifting
    // sections relative to the edit canvas.
    const pages = useMemo<DocumentTemplatePageSlice[]>(
        () => splitTemplateLayoutIntoPages(renderedHtml),
        [renderedHtml]
    )

    const renderPage = (page: DocumentTemplatePageSlice, key: string, print: boolean) => (
        <div
            key={key}
            className={cn(
                print
                    ? cn(
                          "document-template-print-page",
                          "relative flex flex-col overflow-hidden bg-white",
                          DOCUMENT_TEMPLATE_HEADER_FOOTER_STYLES
                      )
                    : cn(
                          A4_DOCUMENT_GROWING_PAGE_CLASS,
                          "flex flex-col",
                          DOCUMENT_TEMPLATE_HEADER_FOOTER_STYLES
                      )
            )}
        >
            <DocumentPageWatermark watermark={watermark} />
            {page.headerHtml ? (
                <div
                    className="relative z-10 shrink-0 bg-white"
                    dangerouslySetInnerHTML={{ __html: page.headerHtml }}
                />
            ) : null}
            <div
                className={cn(
                    "relative z-10 min-h-0 flex-1",
                    A4_DOCUMENT_CONTENT_CLASS
                )}
                dangerouslySetInnerHTML={{ __html: page.bodyHtml }}
            />
            {page.footerHtml ? (
                <div
                    className="relative z-10 mt-auto shrink-0 bg-white"
                    dangerouslySetInnerHTML={{ __html: page.footerHtml }}
                />
            ) : null}
        </div>
    )

    return (
        <div className={cn("space-y-4", className)}>
            <Typography as="h3" font="title">
                {title}
            </Typography>
            <div className={A4_DOCUMENT_SHEET_WRAPPER_CLASS}>
                <div className={A4_DOCUMENT_MULTI_PAGE_STACK_CLASS}>
                    {pages.map((page, index) =>
                        renderPage(page, `template-page-${index}`, false)
                    )}
                </div>
            </div>
            {printable && isClientReady
                ? createPortal(
                      <div className="document-template-print-root">
                          {pages.map((page, index) =>
                              renderPage(page, `template-print-page-${index}`, true)
                          )}
                      </div>,
                      document.body
                  )
                : null}
        </div>
    )
})
