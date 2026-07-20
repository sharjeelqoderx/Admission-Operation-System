
"use client"

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
    const phoneInputProps = {
        country: country || (value ? undefined : "us"),
        value,
        onChange,
        placeholder,
        disabled,
        searchable: true,
        searchPlaceholder: "Search",
        enableAreaCodes: false,
        enableTerritories: false,
        containerClass: "w-full relative z-[9999]",
        inputClass: "w-full",
        containerStyle: { width: "100%", zIndex: 9999 },
        inputStyle: { 
            width: "100%", 
            minWidth: 0, 
            height: "50px", 
            border: "none", 
            backgroundColor: "#F4F4F4", 
            background: "#F4F4F4",
            borderRadius: "0 0.125rem 0.125rem 0",
            paddingLeft: "62px",
            paddingTop: "0.25rem",
            paddingBottom: "0.25rem",
            paddingRight: "0.625rem"
        },
        buttonStyle: {
            border: "none",
            backgroundColor: "#F4F4F4",
            background: "#F4F4F4",
            borderRadius: "0.125rem 0 0 0.125rem",
            height: "50px",
            width: "55px"
        },
        dropdownStyle: { zIndex: 9999 }
    } as any

    return (
        <div className={cn("w-full min-w-0 relative z-[9999]", className)}>
            <PhoneInput {...phoneInputProps} />
        </div>
    )
}

