"use client"

import { memo, useMemo } from "react"
import { Typography } from "@/components/shared/Typography"
import { DocumentPageWatermark } from "./document-center-logo-placeholder"
import {
    A4_DOCUMENT_CONTENT_CLASS,
    A4_DOCUMENT_MULTI_PAGE_STACK_CLASS,
    A4_DOCUMENT_PAGE_CLASS,
    A4_DOCUMENT_SHEET_WRAPPER_CLASS,
    splitTemplateBodyIntoPages,
} from "@/lib/document-template/a4-document"
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

        return splitTemplateBodyIntoPages(renderedHtml)
    }, [bodyHtml, useSampleData])

    return (
        <div className={cn("space-y-4", className)}>
            <Typography as="h3" font="title">
                {title}
            </Typography>
            <div className={A4_DOCUMENT_SHEET_WRAPPER_CLASS}>
                <div className={A4_DOCUMENT_MULTI_PAGE_STACK_CLASS}>
                    {pages.map((pageHtml, index) => (
                        <div
                            key={`template-page-${index}`}
                            className={cn(
                                A4_DOCUMENT_PAGE_CLASS,
                                printable && "document-template-print-target"
                            )}
                        >
                            <DocumentPageWatermark />
                            <div
                                className={cn("relative z-10", A4_DOCUMENT_CONTENT_CLASS)}
                                dangerouslySetInnerHTML={{ __html: pageHtml }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
})
