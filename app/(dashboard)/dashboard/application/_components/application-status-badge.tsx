"use client"

import { memo } from "react"
import { ApplicationStatus, StatusBadge } from "@/components/shared/StatusBadge"
import type { Tables } from "@/types/supabase"

type ApplicationStatusBadgeProps = {
    status: Tables<"application">["status"]
    offerLetter?: Pick<Tables<"offer_letter">, "status"> | null
}

export const ApplicationStatusBadge = memo(function ApplicationStatusBadge({
    status,
    offerLetter = null,
}: ApplicationStatusBadgeProps) {
    if (offerLetter) {
        return <StatusBadge status={ApplicationStatus.CONDITIONAL_LETTER_ISSUED} />
    }

    return <StatusBadge status={status} />
})
