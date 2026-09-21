"use client"

import { memo, type ReactNode, type Ref } from "react"
import { DocumentPageWatermark } from "./document-center-logo-placeholder"
import {
    A4_DOCUMENT_CONTENT_CLASS,
    A4_DOCUMENT_PAGE_CLASS,
} from "@/lib/document-template/a4-document"
import { DOCUMENT_TEMPLATE_HEADER_FOOTER_STYLES } from "@/lib/document-template/header-footer"
import type { DocumentTemplateWatermark } from "@/lib/document-template/watermark"
import { cn } from "@/lib/utils"

type DocumentTemplateA4PageFrameProps = {
    headerHtml?: string | null
    footerHtml?: string | null
    bodyHtml?: string | null
    watermark?: DocumentTemplateWatermark | null
    bodyClassName?: string
    pageRef?: Ref<HTMLDivElement>
    children?: ReactNode
    className?: string
}

export const DocumentTemplateA4PageFrame = memo(function DocumentTemplateA4PageFrame({
    headerHtml,
    footerHtml,
    bodyHtml,
    watermark,
    bodyClassName,
    pageRef,
    children,
    className,
}: DocumentTemplateA4PageFrameProps) {
    return (
        <div
            ref={pageRef}
            className={cn(
                A4_DOCUMENT_PAGE_CLASS,
                "relative flex flex-col",
                DOCUMENT_TEMPLATE_HEADER_FOOTER_STYLES,
                className
            )}
        >
            <DocumentPageWatermark watermark={watermark} />
            {headerHtml ? (
                <div
                    className="relative z-10 shrink-0 bg-white"
                    dangerouslySetInnerHTML={{ __html: headerHtml }}
                />
            ) : null}
            {bodyHtml ? (
                <div
                    className={cn(
                        "relative z-10 min-h-0 flex-1 overflow-hidden",
                        A4_DOCUMENT_CONTENT_CLASS,
                        bodyClassName
                    )}
                    dangerouslySetInnerHTML={{ __html: bodyHtml }}
                />
            ) : (
                children ?? <div className="relative z-0 min-h-0 flex-1" aria-hidden />
            )}
            {footerHtml ? (
                <div
                    className="relative z-10 mt-auto shrink-0 bg-white"
                    dangerouslySetInnerHTML={{ __html: footerHtml }}
                />
            ) : null}
        </div>
    )
})
