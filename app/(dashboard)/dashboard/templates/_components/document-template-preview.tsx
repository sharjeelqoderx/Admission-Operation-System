"use client"

import { memo, useLayoutEffect, useMemo, useState } from "react"
import { Typography } from "@/components/shared/Typography"
import { DocumentPageWatermark } from "./document-center-logo-placeholder"
import {
    A4_DOCUMENT_CONTENT_CLASS,
    A4_DOCUMENT_MULTI_PAGE_STACK_CLASS,
    A4_DOCUMENT_PAGE_BODY_CLASS,
    A4_DOCUMENT_PAGE_CLASS,
    A4_DOCUMENT_SHEET_WRAPPER_CLASS,
    A4_PAGE_HEIGHT_PX,
    A4_PAGE_PADDING_X_MM,
    A4_PAGE_PADDING_Y_MM,
    mmToPx,
    A4_PAGE_WIDTH_MM,
} from "@/lib/document-template/a4-document"
import {
    DOCUMENT_TEMPLATE_HEADER_FOOTER_STYLES,
    parseDocumentLayout,
    type DocumentTemplatePageSlice,
} from "@/lib/document-template/header-footer"
import { paginateBodyHtmlByA4Height } from "@/lib/document-template/a4-pagination"
import {
    renderTemplateHtml,
    TEMPLATE_PREVIEW_SAMPLE_DATA,
} from "@/lib/document-template/variables"
import { cn } from "@/lib/utils"

type DocumentTemplatePreviewProps = {
    title: string
    bodyHtml: string
    useSampleData?: boolean
    className?: string
    printable?: boolean
}

function measureHtmlBlockHeight(html: string, widthPx: number, className: string): number {
    if (typeof document === "undefined" || !html.trim()) {
        return 0
    }

    const container = document.createElement("div")
    container.style.position = "fixed"
    container.style.left = "-10000px"
    container.style.top = "0"
    container.style.visibility = "hidden"
    container.style.width = `${widthPx}px`
    container.className = className
    container.innerHTML = html
    document.body.appendChild(container)
    const height = container.scrollHeight
    container.remove()
    return height
}

export const DocumentTemplatePreview = memo(function DocumentTemplatePreview({
    title,
    bodyHtml,
    useSampleData = true,
    className,
    printable = false,
}: DocumentTemplatePreviewProps) {
    const renderedHtml = useMemo(
        () =>
            useSampleData ? renderTemplateHtml(bodyHtml, TEMPLATE_PREVIEW_SAMPLE_DATA) : bodyHtml,
        [bodyHtml, useSampleData]
    )

    const layout = useMemo(() => parseDocumentLayout(renderedHtml), [renderedHtml])

    const contentWidthPx = mmToPx(A4_PAGE_WIDTH_MM - A4_PAGE_PADDING_X_MM * 2)
    const verticalPaddingPx = mmToPx(A4_PAGE_PADDING_Y_MM) * 2

    const [pages, setPages] = useState<DocumentTemplatePageSlice[]>(() => [
        {
            headerHtml: layout.headerHtml,
            bodyHtml: layout.bodyHtml,
            footerHtml: layout.footerHtml,
        },
    ])

    useLayoutEffect(() => {
        const headerHeight = layout.headerHtml
            ? measureHtmlBlockHeight(
                  layout.headerHtml,
                  mmToPx(A4_PAGE_WIDTH_MM - A4_PAGE_PADDING_X_MM * 2),
                  DOCUMENT_TEMPLATE_HEADER_FOOTER_STYLES
              )
            : 0

        const footerHeight = layout.footerHtml
            ? measureHtmlBlockHeight(
                  layout.footerHtml,
                  mmToPx(A4_PAGE_WIDTH_MM - A4_PAGE_PADDING_X_MM * 2),
                  DOCUMENT_TEMPLATE_HEADER_FOOTER_STYLES
              )
            : 0

        const maxBodyHeightPx = Math.max(
            120,
            A4_PAGE_HEIGHT_PX - verticalPaddingPx - headerHeight - footerHeight
        )

        const bodyPages = paginateBodyHtmlByA4Height(layout.bodyHtml, {
            containerWidthPx: contentWidthPx,
            contentClassName: A4_DOCUMENT_CONTENT_CLASS,
            maxBodyHeightPx,
        })

        setPages(
            bodyPages.map((bodyHtml) => ({
                headerHtml: layout.headerHtml,
                bodyHtml,
                footerHtml: layout.footerHtml,
            }))
        )
    }, [contentWidthPx, layout, verticalPaddingPx])

    return (
        <div className={cn("space-y-4", className)}>
            <Typography as="h3" font="title">
                {title}
            </Typography>
            <div className={A4_DOCUMENT_SHEET_WRAPPER_CLASS}>
                <div className={A4_DOCUMENT_MULTI_PAGE_STACK_CLASS}>
                    {pages.map((page, index) => (
                        <div
                            key={`template-page-${index}`}
                            className={cn(
                                A4_DOCUMENT_PAGE_CLASS,
                                "flex flex-col overflow-hidden",
                                DOCUMENT_TEMPLATE_HEADER_FOOTER_STYLES,
                                printable && "document-template-print-target"
                            )}
                        >
                            <DocumentPageWatermark />
                            {page.headerHtml ? (
                                <div
                                    className="relative z-10 shrink-0"
                                    dangerouslySetInnerHTML={{ __html: page.headerHtml }}
                                />
                            ) : null}
                            <div
                                className={cn(
                                    "relative z-10 min-h-0 flex-1 overflow-hidden",
                                    A4_DOCUMENT_PAGE_BODY_CLASS
                                )}
                                dangerouslySetInnerHTML={{ __html: page.bodyHtml }}
                            />
                            {page.footerHtml ? (
                                <div
                                    className="relative z-10 mt-auto shrink-0"
                                    dangerouslySetInnerHTML={{ __html: page.footerHtml }}
                                />
                            ) : null}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
})
