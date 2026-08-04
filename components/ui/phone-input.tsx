"use client"

import type { ComponentProps } from "react"
import PhoneInput from "react-phone-input-2"
import "react-phone-input-2/lib/style.css"
import { cn } from "@/lib/utils"

interface PhoneInputProps {
    value: string
    onChange: (value: string) => void
    className?: string
    placeholder?: string
    disabled?: boolean
    country?: string
}

export function PhoneInputComponent({
    value,
    onChange,
    className,
    placeholder,
    disabled,
    country,
}: PhoneInputProps) {
    return (
        <div
            className={cn(
                "phone-input-shell h-[50px] w-full min-w-0 overflow-hidden rounded-sm border border-input bg-brand-input transition-colors dark:bg-input/30",
                disabled && "pointer-events-none cursor-not-allowed opacity-50",
                className
            )}
        >
            <PhoneInput
                {...({
                    country: country || (value ? undefined : "us"),
                    value,
                    onChange,
                    placeholder,
                    disabled,
                    searchable: true,
                    searchPlaceholder: "Search",
                    enableAreaCodes: false,
                    enableTerritories: false,
                    containerClass: "phone-input-container",
                    inputClass: "phone-input-field",
                    buttonClass: "phone-input-button",
                    dropdownClass: "phone-input-dropdown",
                } as ComponentProps<typeof PhoneInput>)}
            />
        </div>
    )
}
