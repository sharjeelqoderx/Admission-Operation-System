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

export const DocumentStatusFilter = memo(function DocumentStatusFilter({
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
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="VERIFIED">Verified</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="NEEDS_REVISION">Needs revision</SelectItem>
            </SelectContent>
        </Select>
    )
})
