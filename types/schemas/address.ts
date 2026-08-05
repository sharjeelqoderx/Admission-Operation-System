import { z } from "zod"

export const AddressFieldsSchema = z.object({
    street_1: z.string().trim().min(1, "Street 1 is required"),
    street_2: z.string().trim(),
    street_3: z.string().trim(),
    post_code: z.string().trim(),
})

export const OptionalAddressFieldsSchema = z.object({
    street_1: z.string().trim().optional(),
    street_2: z.string().trim().optional(),
    street_3: z.string().trim().optional(),
    post_code: z.string().trim().optional(),
})

export type AddressFieldsInput = z.infer<typeof AddressFieldsSchema>

export function normalizeAddressFields(input: Partial<AddressFieldsInput>) {
    const trimOrNull = (value?: string) => {
        const trimmed = value?.trim()
        return trimmed ? trimmed : null
    }

    return {
        street_1: trimOrNull(input.street_1),
        street_2: trimOrNull(input.street_2),
        street_3: trimOrNull(input.street_3),
        post_code: trimOrNull(input.post_code),
    }
}

export function formatAddressLines(parts: {
    street_1?: string | null
    street_2?: string | null
    street_3?: string | null
    post_code?: string | null
}): string {
    const segments = [parts.street_1, parts.street_2, parts.street_3, parts.post_code].filter(
        (value): value is string => typeof value === "string" && value.trim().length > 0
    )

    return segments.length > 0 ? segments.join(", ") : "—"
}
