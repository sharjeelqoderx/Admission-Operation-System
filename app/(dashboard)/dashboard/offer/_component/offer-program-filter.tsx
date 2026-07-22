"use client"

import { memo } from "react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { CourseProgram } from "@/types/schemas/program"

type Props = {
    value: string
    onValueChange: (value: string) => void
    programs: CourseProgram[]
    isLoading?: boolean
}

function getProgramLabel(program: CourseProgram) {
    const degreeName = program.degree?.name
    return degreeName ? `${program.name} (${degreeName})` : program.name
}

export const OfferProgramFilter = memo(function OfferProgramFilter({
    value,
    onValueChange,
    programs,
    isLoading = false,
}: Props) {
    return (
        <Select value={value} onValueChange={onValueChange} disabled={isLoading}>
            <SelectTrigger className="w-[220px] shrink-0 max-w-[220px]">
                <SelectValue
                    placeholder={isLoading ? "Loading..." : "Program"}
                    className="truncate"
                />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All programs</SelectItem>
                {programs.map((program) => {
                    const label = getProgramLabel(program)

                    return (
                        <SelectItem key={program.id} value={program.id} title={label}>
                            <span className="block max-w-[280px] truncate">{label}</span>
                        </SelectItem>
                    )
                })}
            </SelectContent>
        </Select>
    )
})
