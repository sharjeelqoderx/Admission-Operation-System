"use client"

import { memo } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

type Props = {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

export const DocumentStudentSearch = memo(function DocumentStudentSearch({
    value,
    onChange,
    placeholder = "Search by student name or ID",
}: Props) {
    return (
        <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 z-10 -translate-y-1/2 size-4 text-gray-400" />
            <Input
                type="text"
                placeholder={placeholder}
                className="w-full backdrop-blur-md ps-9"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    )
})
