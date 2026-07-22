"use client"

import { memo, useState } from "react"
import { AlertCircle } from "lucide-react"
import { Typography } from "@/components/shared/Typography"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { DocumentRejectionHistoryEntry } from "@/types/schemas/document"

type PopoverPlacement = "bottom-left" | "bottom-right"

type Props = {
    history: DocumentRejectionHistoryEntry[]
    placement: PopoverPlacement
}

function formatHistoryDate(value: string) {
    return new Date(value).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    })
}

export const DocumentRejectionIndicator = memo(function DocumentRejectionIndicator({
    history,
    placement,
}: Props) {
    const [popoverOpen, setPopoverOpen] = useState(false)
    const latest = history[0]

    if (!latest) {
        return null
    }

    const align = placement === "bottom-right" ? "start" : "end"

    return (
        <TooltipProvider>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <Tooltip open={popoverOpen ? false : undefined}>
                    <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                className="flex items-center justify-center shrink-0 text-red-600 hover:text-red-700 transition-colors"
                                aria-label="View rejection history"
                            >
                                <AlertCircle className="size-4" />
                            </button>
                        </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[220px] px-2.5 py-1.5">
                        <Typography as="p" className="text-xs whitespace-pre-wrap leading-snug">
                            {latest.feedback}
                        </Typography>
                    </TooltipContent>
                </Tooltip>
                <PopoverContent side="bottom" align={align} className="w-[280px] p-0 text-xs">
                    <div className="border-b border-gray-100 px-2.5 py-1">
                        <Typography
                            as="p"
                            className="text-xs font-semibold leading-none text-gray-900"
                        >
                            Rejection History
                        </Typography>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto px-2.5 py-1.5 space-y-1.5">
                        {history.map((entry, index) => (
                            <div
                                key={`${entry.created_at}-${index}`}
                                className={cn(
                                    "space-y-0",
                                    index > 0 && "border-t border-gray-100 pt-1.5"
                                )}
                            >
                                <Typography as="p" className="text-[10px] font-medium leading-none text-gray-500 mb-0.5">
                                    {formatHistoryDate(entry.created_at)}
                                </Typography>
                                <Typography
                                    as="p"
                                    className="text-xs text-gray-700 whitespace-pre-wrap leading-snug"
                                >
                                    {entry.feedback}
                                </Typography>
                            </div>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        </TooltipProvider>
    )
})
