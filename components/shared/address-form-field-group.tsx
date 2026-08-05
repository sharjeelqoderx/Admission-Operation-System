"use client"

import { memo, type ReactNode } from "react"
import { Input } from "@/components/ui/input"
import { Typography } from "@/components/shared/Typography"
import { cn } from "@/lib/utils"

export const ADDRESS_FIELD_CONFIG = [
    {
        name: "street_1" as const,
        label: "Street 1",
        placeholder: "Enter street line 1",
    },
    {
        name: "street_2" as const,
        label: "Street 2",
        placeholder: "Enter street line 2 (optional)",
    },
    {
        name: "street_3" as const,
        label: "Street 3",
        placeholder: "Enter street line 3 (optional)",
    },
    {
        name: "post_code" as const,
        label: "Post Code",
        placeholder: "Enter post code (optional)",
    },
]

export type AddressFieldName = (typeof ADDRESS_FIELD_CONFIG)[number]["name"]

type AddressFormFieldGroupProps = {
    form: {
        Field: React.ComponentType<{
            name: AddressFieldName
            children: (field: AddressFormFieldApi) => ReactNode
        }>
    }
    isEditing: boolean
    className?: string
    showHeading?: boolean
    renderField: (props: {
        field: AddressFormFieldApi
        label: string
        children: ReactNode
    }) => ReactNode
    readOnlyValueClassName?: string
}

type AddressFormFieldApi = {
    name: AddressFieldName
    state: { value: string; meta: { isTouched: boolean; isValid: boolean; errors?: unknown[] } }
    handleBlur: () => void
    handleChange: (value: string) => void
    form: { state: { isSubmitted: boolean } }
}

export const AddressFormFieldGroup = memo(function AddressFormFieldGroup({
    form,
    isEditing,
    className,
    showHeading = true,
    renderField,
    readOnlyValueClassName = "p-3 bg-white/10 rounded-lg border border-white/5 min-h-12 flex items-center",
}: AddressFormFieldGroupProps) {
    return (
        <div className={cn("col-span-full space-y-4", className)}>
            {showHeading ? (
                <Typography font="sub-text" className="font-semibold text-gray-800">
                    Address
                </Typography>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {ADDRESS_FIELD_CONFIG.map(({ name, label, placeholder }) => (
                    <form.Field key={name} name={name}>
                        {(field) =>
                            renderField({
                                field,
                                label,
                                children: isEditing ? (
                                    <Input
                                        id={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(event) => field.handleChange(event.target.value)}
                                        placeholder={placeholder}
                                        className="w-full"
                                    />
                                ) : (
                                    <div className={readOnlyValueClassName}>
                                        <Typography className="text-gray-800 font-medium">
                                            {field.state.value || "N/A"}
                                        </Typography>
                                    </div>
                                ),
                            })
                        }
                    </form.Field>
                ))}
            </div>
        </div>
    )
})
