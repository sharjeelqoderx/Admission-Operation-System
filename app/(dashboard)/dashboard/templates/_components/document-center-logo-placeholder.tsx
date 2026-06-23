"use client"

import { memo } from "react"
import Image from "next/image"
import {
    DEFAULT_PLACEHOLDER_LOGO_SRC,
    DOCUMENT_PAGE_WATERMARK_CLASS,
    PLACEHOLDER_LOGO_SIZE_PX,
} from "@/lib/document-template/a4-document"
import { cn } from "@/lib/utils"

type DocumentPageWatermarkProps = {
    className?: string
}

export const DocumentPageWatermark = memo(function DocumentPageWatermark({
    className,
}: DocumentPageWatermarkProps) {
    return (
        <div
            className={cn(
                DOCUMENT_PAGE_WATERMARK_CLASS,
                "pointer-events-none absolute inset-0 z-0 flex items-center justify-center",
                className
            )}
            aria-hidden
        >
            <Image
                src={DEFAULT_PLACEHOLDER_LOGO_SRC}
                alt=""
                width={PLACEHOLDER_LOGO_SIZE_PX}
                height={PLACEHOLDER_LOGO_SIZE_PX}
                className="max-h-full max-w-full object-contain opacity-[0.12]"
                style={{
                    width: PLACEHOLDER_LOGO_SIZE_PX,
                    height: PLACEHOLDER_LOGO_SIZE_PX,
                }}
            />
        </div>
    )
})

/** @deprecated Use DocumentPageWatermark */
export const DocumentCenterLogoPlaceholder = DocumentPageWatermark
