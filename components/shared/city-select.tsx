"use client"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useCities } from "@/hooks/useLocations"
import { cn } from "@/lib/utils"

type CitySelectProps = {
    country: string
    state: string
    value: string
    onValueChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
    className?: string
    id?: string
}

export function CitySelect({
    country,
    state,
    value,
    onValueChange,
    placeholder = "Select city",
    disabled,
    className,
    id,
}: CitySelectProps) {
    const { data: cities, isLoading, isError } = useCities(country, state)
    const hasState = Boolean(country.trim() && state.trim())

    return (
        <Select
            value={value || undefined}
            onValueChange={onValueChange}
            disabled={disabled || !hasState || isLoading || isError}
        >
            <SelectTrigger id={id} className={cn("w-full", className)}>
                <SelectValue
                    placeholder={
                        !hasState
                            ? "Select state first"
                            : isLoading
                              ? "Loading cities..."
                              : isError
                                ? "Could not load cities"
                                : placeholder
                    }
                />
            </SelectTrigger>
            <SelectContent className="max-h-60">
                {cities?.map((city) => (
                    <SelectItem key={city} value={city}>
                        {city}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
