"use client"

import { memo } from "react"
import Image from "next/image"
import { DOCUMENT_PAGE_WATERMARK_CLASS } from "@/lib/document-template/a4-document"
import {
    getWatermarkFlexStyles,
    getWatermarkImageStyle,
    isWatermarkVisible,
    resolveWatermarkImageSrc,
    type DocumentTemplateWatermark,
} from "@/lib/document-template/watermark"
import { cn } from "@/lib/utils"

type DocumentPageWatermarkProps = {
    watermark?: DocumentTemplateWatermark | null
    className?: string
}

export const DocumentPageWatermark = memo(function DocumentPageWatermark({
    watermark,
    className,
}: DocumentPageWatermarkProps) {
    if (!isWatermarkVisible(watermark)) {
        return null
    }

    const resolved = watermark!
    const imageSrc = resolveWatermarkImageSrc(resolved)
    const flexStyles = getWatermarkFlexStyles(resolved.position)
    const imageStyle = getWatermarkImageStyle(resolved)

    return (
        <div
            className={cn(
                DOCUMENT_PAGE_WATERMARK_CLASS,
                "pointer-events-none absolute inset-0 z-0 flex",
                className
            )}
            aria-hidden
            style={{
                alignItems: flexStyles.alignItems,
                justifyContent: flexStyles.justifyContent,
                paddingTop: flexStyles.paddingTop,
                paddingBottom: flexStyles.paddingBottom,
            }}
        >
            <Image
                src={imageSrc}
                alt=""
                width={imageStyle.width}
                height={imageStyle.height}
                unoptimized={imageSrc.startsWith("http")}
                className="max-h-full max-w-full object-contain"
                style={imageStyle}
            />
        </div>
    )
})

/** @deprecated Use DocumentPageWatermark */
export const DocumentCenterLogoPlaceholder = DocumentPageWatermark
