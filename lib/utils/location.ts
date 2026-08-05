export type LocationParts = {
    city?: string | null
    state?: string | null
    country?: string | null
}

/** Formats a postal address for HTML document templates. */
export function formatPostalAddress(parts: {
    street_1?: string | null
    street_2?: string | null
    street_3?: string | null
    post_code?: string | null
    city?: string | null
    state?: string | null
    country?: string | null
    /** @deprecated legacy single-line address */
    address?: string | null
    /** @deprecated legacy post code column */
    zip_code?: string | null
}): string {
    const lines: string[] = []

    const streetLines = [parts.street_1, parts.street_2, parts.street_3].filter(
        (value): value is string => typeof value === "string" && value.trim().length > 0
    )

    if (streetLines.length > 0) {
        lines.push(...streetLines.map((line) => line.trim()))
    } else if (parts.address?.trim()) {
        lines.push(parts.address.trim())
    }

    const postCode = parts.post_code?.trim() || parts.zip_code?.trim() || null
    const locality = [parts.city, parts.state, postCode]
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .join(", ")

    if (locality) {
        lines.push(locality)
    }

    if (parts.country?.trim()) {
        lines.push(parts.country.trim())
    }

    return lines.length > 0 ? lines.join("<br />") : "—"
}

/** Formats city, state, country for display (e.g. "Lahore, Punjab, Pakistan"). */
export function formatLocation(parts: LocationParts): string {
    const segments = [parts.city, parts.state, parts.country].filter(
        (v): v is string => typeof v === "string" && v.trim().length > 0
    )
    return segments.length > 0 ? segments.join(", ") : "—"
}
