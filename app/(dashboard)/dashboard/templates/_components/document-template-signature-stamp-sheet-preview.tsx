"use client"

import { memo } from "react"
import { Typography } from "@/components/shared/Typography"
import { DOCUMENT_TEMPLATE_HEADER_FOOTER_STYLES } from "@/lib/document-template/header-footer"
import {
    DOCUMENT_TEMPLATE_SIGNATURE_STAMP_GAP_PX,
    DOCUMENT_TEMPLATE_SIGNATURE_STAMP_STYLES,
} from "@/lib/document-template/signature-stamp"
import { cn } from "@/lib/utils"

type DocumentTemplateSignatureStampSheetPreviewProps = {
    signatureStampHtml: string
    footerHtml?: string | null
    showFooter?: boolean
    className?: string
}

/** Matches the editor page footer band (padding + sign/stamp above footer). */
export const DocumentTemplateSignatureStampSheetPreview = memo(
    function DocumentTemplateSignatureStampSheetPreview({
        signatureStampHtml,
        footerHtml,
        showFooter = false,
        className,
    }: DocumentTemplateSignatureStampSheetPreviewProps) {
        return (
            <div className={cn("space-y-2", className)}>
                <Typography as="span" font="small" className="font-medium text-muted-foreground">
                    Live preview — same width and padding as the letter footer
                </Typography>
                <div className="overflow-x-auto overflow-y-visible rounded-lg border border-brand-secondary/20 bg-[#eef1f5] p-2">
                    <div
                        className="mx-auto w-full min-w-[min(100%,280px)] max-w-[210mm] overflow-visible bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
                        style={{ minHeight: "min(42vw, 200px)" }}
                    >
                        <div
                            className="h-6 shrink-0 border-b border-dashed border-muted-foreground/15 bg-gradient-to-b from-muted/25 to-white"
                            aria-hidden
                        />
                        <div
                            className="flex min-h-[140px] flex-col justify-end overflow-visible px-[15mm] pb-[20mm] pt-3"
                            style={{
                                gap:
                                    showFooter && footerHtml
                                        ? DOCUMENT_TEMPLATE_SIGNATURE_STAMP_GAP_PX
                                        : 0,
                            }}
                        >
                            <div
                                className={cn(
                                    "w-full min-w-0 overflow-visible",
                                    DOCUMENT_TEMPLATE_SIGNATURE_STAMP_STYLES,
                                    DOCUMENT_TEMPLATE_HEADER_FOOTER_STYLES
                                )}
                                dangerouslySetInnerHTML={{ __html: signatureStampHtml }}
                            />
                            {showFooter && footerHtml ? (
                                <div
                                    className={cn(
                                        "w-full min-w-0 shrink-0 overflow-visible",
                                        DOCUMENT_TEMPLATE_HEADER_FOOTER_STYLES
                                    )}
                                    dangerouslySetInnerHTML={{ __html: footerHtml }}
                                />
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        )
    }
)
