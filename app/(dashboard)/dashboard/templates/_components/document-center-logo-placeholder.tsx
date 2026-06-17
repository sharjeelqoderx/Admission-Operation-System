"use client"

import { memo } from "react"
import Image from "next/image"
import {
    DEFAULT_PLACEHOLDER_LOGO_SRC,
    PLACEHOLDER_LOGO_SIZE_PX,
} from "@/lib/document-template/a4-document"

export const DocumentCenterLogoPlaceholder = memo(function DocumentCenterLogoPlaceholder() {
    return (
        <div
            className="document-center-logo-placeholder pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
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
