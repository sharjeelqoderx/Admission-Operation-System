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

function formatFeedback(feedback: string) {
    return feedback.replace(/^\[DEFERRED\]\s*/i, "Defer Intake: ")
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
                                onClick={(e) => {
                                    e.stopPropagation()
                                }}
                                className="flex items-center justify-center shrink-0 text-red-600 hover:text-red-700 transition-colors"
                                aria-label="View rejection history"
                            >
                                <AlertCircle className="size-4" />
                            </button>
                        </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[240px] px-3 py-2">
                        <Typography as="p" className="text-xs whitespace-pre-wrap leading-relaxed">
                            {formatFeedback(latest.feedback)}
                        </Typography>
                    </TooltipContent>
                </Tooltip>
                <PopoverContent
                    side="bottom"
                    align={align}
                    onClick={(e) => {
                        e.stopPropagation()
                    }}
                    className="w-[300px] overflow-hidden p-0 gap-0 shadow-lg ring-1 ring-red-100/70"
                >
                    <div className="border-b border-red-100 bg-red-50/80 px-4 py-3">
                        <div className="flex items-start gap-2.5">
                            <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-red-100/80">
                                <AlertCircle className="size-3.5 text-red-600" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-0.5">
                                <Typography
                                    as="p"
                                    className="text-sm font-semibold leading-snug text-gray-900"
                                >
                                    Rejection History
                                </Typography>
                                <Typography
                                    as="p"
                                    className="text-[11px] font-medium leading-snug text-red-700/80"
                                >
                                    {history.length === 1
                                        ? "1 review note"
                                        : `${history.length} review notes`}
                                </Typography>
                            </div>
                        </div>
                    </div>

                    <div className="max-h-[260px] overflow-y-auto px-3 py-3 space-y-2.5">
                        {history.map((entry, index) => (
                            <div
                                key={`${entry.created_at}-${index}`}
                                className={cn(
                                    "rounded-lg border px-3.5 py-3",
                                    index === 0
                                        ? "border-red-100/90 bg-red-50/35"
                                        : "border-gray-100 bg-gray-50/70"
                                )}
                            >
                                <Typography
                                    as="p"
                                    className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500"
                                >
                                    {formatHistoryDate(entry.created_at)}
                                </Typography>
                                <Typography
                                    as="p"
                                    className="text-xs leading-relaxed text-gray-700 whitespace-pre-wrap"
                                >
                                    {formatFeedback(entry.feedback)}
                                </Typography>
                            </div>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        </TooltipProvider>
    )
})
