"use client"

import { memo } from "react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type Props = {
    value: string
    onValueChange: (value: string) => void
}

export const OfferStatusFilter = memo(function OfferStatusFilter({
    value,
    onValueChange,
}: Props) {
    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className="w-[160px] shrink-0">
                <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
        </Select>
    )
})
