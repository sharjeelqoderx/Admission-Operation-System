"use client"

import { memo } from "react"
import { Card } from "@/components/ui/card"
import { Typography } from "@/components/shared/Typography"
import type { ApplicationReviewHistoryEntry } from "@/types/schemas/application"
import { applicationDetailCardClassName } from "./application-detail-card-styles"
import { cn } from "@/lib/utils"

type Props = {
    history: ApplicationReviewHistoryEntry[]
    className?: string
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

function getStatusLabel(status: string) {
    switch (status) {
        case "REJECTED":
            return "Rejected"
        case "NEEDS_REVISION":
            return "Needs revision"
        case "PENDING":
            return "Resubmitted"
        case "APPROVED":
            return "Approved"
        default:
            return status.replace(/_/g, " ")
    }
}

function formatFeedback(feedback: string) {
    return feedback.replace(/^\[DEFERRED\]\s*/i, "Defer Intake: ")
}

export const ApplicationReviewHistoryCard = memo(function ApplicationReviewHistoryCard({
    history,
    className,
}: Props) {
    if (history.length === 0) {
        return null
    }

    return (
        <Card className={cn("px-5 py-5", applicationDetailCardClassName, className)}>
            <Typography as="h3" className="mb-4 text-base font-semibold text-foreground">
                Review History
            </Typography>

            <div className="space-y-3">
                {history.map((entry, index) => (
                    <div
                        key={`${entry.created_at}-${entry.status}-${index}`}
                        className="space-y-1 border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                    >
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <Typography as="p" className="text-sm font-medium text-foreground">
                                {getStatusLabel(entry.status)}
                            </Typography>
                            <Typography as="p" className="text-xs text-muted-foreground">
                                {formatHistoryDate(entry.created_at)}
                            </Typography>
                        </div>

                        {entry.reviewed_by_name || entry.reviewed_by_profile_id ? (
                            <Typography as="p" className="text-xs text-muted-foreground">
                                By {entry.reviewed_by_name ?? "Unknown"}
                                {entry.reviewed_by_profile_id
                                    ? ` (ID: ${entry.reviewed_by_profile_id})`
                                    : null}
                            </Typography>
                        ) : null}

                        {entry.feedback ? (
                            <Typography
                                as="p"
                                className="text-xs font-normal text-muted-foreground whitespace-pre-wrap leading-relaxed"
                            >
                                {formatFeedback(entry.feedback)}
                            </Typography>
                        ) : null}
                    </div>
                ))}
            </div>
        </Card>
    )
})
