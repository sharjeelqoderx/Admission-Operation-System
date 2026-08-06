"use client"

import { memo } from "react"
import Image from "next/image"
import {
    PLACEHOLDER_LOGO_SIZE_PX,
    DOCUMENT_PAGE_WATERMARK_CLASS,
} from "@/lib/document-template/a4-document"
import {
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

    const imageSrc = resolveWatermarkImageSrc(watermark!)
    const sizePx = watermark?.size_px ?? PLACEHOLDER_LOGO_SIZE_PX
    const opacity = watermark?.opacity ?? 0.12

    return (
        <div
            className={cn(
                DOCUMENT_PAGE_WATERMARK_CLASS,
                "pointer-events-none absolute inset-0 z-0 flex items-center justify-center",
                className
            )}
            aria-hidden
            style={
                {
                    "--watermark-size": `${sizePx}px`,
                    "--watermark-opacity": opacity,
                } as React.CSSProperties
            }
        >
            <Image
                src={imageSrc}
                alt=""
                width={sizePx}
                height={sizePx}
                unoptimized={imageSrc.startsWith("http")}
                className="max-h-full max-w-full object-contain"
                style={{
                    width: sizePx,
                    height: sizePx,
                    opacity,
                }}
            />
        </div>
    )
})

/** @deprecated Use DocumentPageWatermark */
export const DocumentCenterLogoPlaceholder = DocumentPageWatermark
