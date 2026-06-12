
"use client"

import PhoneInput from "react-phone-input-2"
import "react-phone-input-2/lib/style.css"
import { useEffect } from "react"

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
    // Override react-phone-input-2 styles to match our design
    useEffect(() => {
        const style = document.createElement('style')
        style.innerHTML = `
            .react-tel-input {
                width: 100% !important;
            }
            .react-tel-input .flag-dropdown {
                border: 1px solid #e5e7eb !important;
                background-color: #f8f9fc !important;
                border-radius: 0.25rem 0 0 0.25rem !important;
                height: 50px !important;
                width: 55px !important;
            }
            .react-tel-input .form-control {
                height: 50px !important;
                border: 1px solid #e5e7eb !important;
                background-color: #f8f9fc !important;
                border-radius: 0 0.25rem 0.25rem 0 !important;
                padding-left: 62px !important;
            }
        `
        document.head.appendChild(style)
        return () => style.remove()
    }, [])

    const phoneInputProps = {
        country: "us",
        value,
        onChange,
        placeholder,
        disabled,
        searchable: true,
        searchPlaceholder: "Search",
        enableAreaCodes: false,
        enableTerritories: false,
    } as any

    return (
        <div className="w-full">
            <PhoneInput {...phoneInputProps} />
        </div>
    )
}

