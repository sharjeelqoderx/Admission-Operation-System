"use client"

import { memo } from "react"
import { Input } from "@/components/ui/input"
import { Typography } from "@/components/shared/Typography"

type AddressFieldName = "street_1" | "street_2" | "post_code"

type AddressFormFieldsProps = {
    isEditing: boolean
    values: Partial<Record<AddressFieldName, string>>
    renderField: (params: {
        name: AddressFieldName
        label: string
        placeholder: string
        children: React.ReactNode
    }) => React.ReactNode
}

export const AddressFormFields = memo(function AddressFormFields({
    isEditing,
    values,
    renderField,
}: AddressFormFieldsProps) {
    const fields: Array<{
        name: AddressFieldName
        label: string
        placeholder: string
    }> = [
        { name: "street_1", label: "Street 1", placeholder: "Enter street line 1" },
        { name: "street_2", label: "Street 2", placeholder: "Enter street line 2 (optional)" },
        { name: "post_code", label: "Postal Code", placeholder: "Enter postal code (optional)" },
    ]

    return (
        <>
            {fields.map((field) =>
                renderField({
                    ...field,
                    children: isEditing ? (
                        <Input placeholder={field.placeholder} />
                    ) : (
                        <div className="flex min-h-12 items-center rounded-lg border border-white/5 bg-white/10 p-3">
                            <Typography className="font-medium text-gray-800">
                                {values[field.name]?.trim() || "N/A"}
                            </Typography>
                        </div>
                    ),
                })
            )}
        </>
    )
})
