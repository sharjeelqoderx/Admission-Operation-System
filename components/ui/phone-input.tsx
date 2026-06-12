
"use client"

import PhoneInput from "react-phone-input-2"
import "react-phone-input-2/lib/style.css"

interface PhoneInputProps {
    value: string
    onChange: (value: string) => void
    className?: string
    placeholder?: string
    disabled?: boolean
}

export function PhoneInputComponent({
    value,
    onChange,
    placeholder,
    disabled,
}: PhoneInputProps) {
    const phoneInputProps = {
        country: "us",
        value,
        onChange,
        placeholder,
        disabled,
        searchable: true,
        searchPlaceholder: "Search",
        inputClass: "h-12 w-full rounded-lg border border-gray-200 bg-white px-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
        buttonClass: "h-12 border border-gray-200 border-r-0 rounded-l-lg bg-gray-50",
        enableAreaCodes: false,
        enableTerritories: false,
    } as any

    return (
        <div className="w-full">
            <PhoneInput {...phoneInputProps} />
        </div>
    )
}
