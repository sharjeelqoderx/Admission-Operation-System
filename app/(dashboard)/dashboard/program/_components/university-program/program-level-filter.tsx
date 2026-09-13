"use client"

import { memo } from "react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useLevels } from "@/hooks/useLevels"
import { getLevelBadgeStyle } from "@/lib/utils/levels"

type Props = {
    value: string
    onValueChange: (value: string) => void
}

export const ProgramLevelFilter = memo(function ProgramLevelFilter({
    value,
    onValueChange,
}: Props) {
    const { data: levels = [], isLoading } = useLevels()

    return (
        <Select value={value} onValueChange={onValueChange} disabled={isLoading}>
            <SelectTrigger className="h-12 w-full shrink-0 border-none bg-white shadow-sm ring-1 ring-black/5 sm:w-[200px]">
                <SelectValue placeholder="All levels" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                {levels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                        <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${getLevelBadgeStyle(level.name)}`}
                        >
                            {level.name}
                        </span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
})
