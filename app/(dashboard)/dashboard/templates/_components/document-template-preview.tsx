"use client"

import { memo } from "react"
import { Typography } from "@/components/shared/Typography"
import { DocumentCenterLogoPlaceholder } from "./document-center-logo-placeholder"
import {
    A4_DOCUMENT_CONTENT_CLASS,
    A4_DOCUMENT_PAGE_CLASS,
    A4_DOCUMENT_SHEET_WRAPPER_CLASS,
    hasCenterLogo,
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
    const renderedHtml = useSampleData
        ? renderTemplateHtml(bodyHtml, TEMPLATE_PREVIEW_SAMPLE_DATA)
        : bodyHtml

    const showCenterPlaceholder = !hasCenterLogo(renderedHtml)

    return (
        <div className={cn("space-y-4", className)}>
            <Typography as="h3" font="title">
                {title}
            </Typography>
            <div className={A4_DOCUMENT_SHEET_WRAPPER_CLASS}>
                <div
                    className={cn(
                        A4_DOCUMENT_PAGE_CLASS,
                        printable && "document-template-print-target"
                    )}
                >
                    {showCenterPlaceholder ? <DocumentCenterLogoPlaceholder /> : null}
                    <div
                        className={cn("relative z-10", A4_DOCUMENT_CONTENT_CLASS)}
                        dangerouslySetInnerHTML={{ __html: renderedHtml }}
                    />
                </div>
            </div>
        </div>
    )
})
