"use client"

import { memo, useMemo } from "react"
import { Typography } from "@/components/shared/Typography"
import { DocumentPageWatermark } from "./document-center-logo-placeholder"
import {
    A4_DOCUMENT_CONTENT_CLASS,
    A4_DOCUMENT_MULTI_PAGE_STACK_CLASS,
    A4_DOCUMENT_PAGE_CLASS,
    A4_DOCUMENT_SHEET_WRAPPER_CLASS,
} from "@/lib/document-template/a4-document"
import {
    DOCUMENT_TEMPLATE_HEADER_FOOTER_STYLES,
    splitTemplateLayoutIntoPages,
} from "@/lib/document-template/header-footer"
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

export const DocumentTemplatePreview = memo(function DocumentTemplatePreview({
    title,
    bodyHtml,
    useSampleData = true,
    className,
    printable = false,
}: DocumentTemplatePreviewProps) {
    const pages = useMemo(() => {
        const renderedHtml = useSampleData
            ? renderTemplateHtml(bodyHtml, TEMPLATE_PREVIEW_SAMPLE_DATA)
            : bodyHtml

        return splitTemplateLayoutIntoPages(renderedHtml)
    }, [bodyHtml, useSampleData])

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
                                "flex flex-col",
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
                                    "relative z-10 min-h-0 flex-1",
                                    A4_DOCUMENT_CONTENT_CLASS
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
