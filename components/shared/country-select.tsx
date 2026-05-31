"use client"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useCountries } from "@/hooks/useLocations"
import { cn } from "@/lib/utils"

type CountrySelectProps = {
    value: string
    onValueChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
    className?: string
    id?: string
}

export function CountrySelect({
    value,
    onValueChange,
    placeholder = "Select country",
    disabled,
    className,
    id,
}: CountrySelectProps) {
    const { data: countries, isLoading, isError } = useCountries()

    return (
        <Select
            value={value || undefined}
            onValueChange={onValueChange}
            disabled={disabled || isLoading || isError}
        >
            <SelectTrigger id={id} className={cn("w-full", className)}>
                <SelectValue
                    placeholder={
                        isLoading
                            ? "Loading countries..."
                            : isError
                              ? "Could not load countries"
                              : placeholder
                    }
                />
            </SelectTrigger>
            <SelectContent className="max-h-60">
                {countries?.map((country) => (
                    <SelectItem key={country.iso2} value={country.name}>
                        {country.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
