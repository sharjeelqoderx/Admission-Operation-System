"use client"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useStates } from "@/hooks/useLocations"
import { cn } from "@/lib/utils"

type StateSelectProps = {
    country: string
    value: string
    onValueChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
    className?: string
    id?: string
}

export function StateSelect({
    country,
    value,
    onValueChange,
    placeholder = "Select state",
    disabled,
    className,
    id,
}: StateSelectProps) {
    const { data: states, isLoading, isError } = useStates(country)
    const hasCountry = Boolean(country.trim())

    return (
        <Select
            value={value || undefined}
            onValueChange={onValueChange}
            disabled={disabled || !hasCountry || isLoading || isError}
        >
            <SelectTrigger id={id} className={cn("w-full", className)}>
                <SelectValue
                    placeholder={
                        !hasCountry
                            ? "Select country first"
                            : isLoading
                              ? "Loading states..."
                              : isError
                                ? "Could not load states"
                                : placeholder
                    }
                />
            </SelectTrigger>
            <SelectContent className="max-h-60">
                {states?.map((state) => (
                    <SelectItem key={state} value={state}>
                        {state}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
