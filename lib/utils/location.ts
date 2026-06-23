export type LocationParts = {
    city?: string | null
    state?: string | null
    country?: string | null
}

/** Formats a postal address for HTML document templates. */
export function formatPostalAddress(parts: {
    address?: string | null
    city?: string | null
    state?: string | null
    country?: string | null
    zip_code?: string | null
}): string {
    const lines: string[] = []

    if (parts.address?.trim()) {
        lines.push(parts.address.trim())
    }

    const locality = [parts.city, parts.state, parts.zip_code]
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
