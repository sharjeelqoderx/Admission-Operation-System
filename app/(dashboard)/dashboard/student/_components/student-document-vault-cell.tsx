"use client"

import { memo } from "react"
import { Typography } from "@/components/shared/Typography"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

type StudentDocumentVaultCellProps = {
    studentName: string
    documentsUploadedCount: number
    totalDocumentTypes: number
    documentUploadPercentage: number
    disabled?: boolean
    isOpening?: boolean
    onOpen: () => void
}

export const StudentDocumentVaultCell = memo(function StudentDocumentVaultCell({
    studentName,
    documentsUploadedCount,
    totalDocumentTypes,
    documentUploadPercentage,
    disabled = false,
    isOpening = false,
    onOpen,
}: StudentDocumentVaultCellProps) {
    return (
        <button
            type="button"
            disabled={disabled || isOpening}
            onClick={onOpen}
            className={cn(
                "block w-full text-left rounded-lg p-2 -m-2 hover:bg-brand-secondary/10 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary/40",
                "disabled:opacity-60 disabled:pointer-events-none"
            )}
            aria-label={`View documents for ${studentName}`}
        >
            <Typography as="span" className="text-sm font-bold text-brand-blue-text">
                {documentUploadPercentage}%
            </Typography>
            <Progress value={documentUploadPercentage} className="h-1.5 w-24 mt-1.5" />
            <Typography as="span" className="text-[11px] text-gray-500 font-light mt-1.5 block">
                {isOpening
                    ? "Opening..."
                    : `${documentsUploadedCount}/${totalDocumentTypes} uploaded`}
            </Typography>
        </button>
    )
})
