export type LocationParts = {
    city?: string | null
    state?: string | null
    country?: string | null
}

/** Formats city, state, country for display (e.g. "Lahore, Punjab, Pakistan"). */
export function formatLocation(parts: LocationParts): string {
    const segments = [parts.city, parts.state, parts.country].filter(
        (v): v is string => typeof v === "string" && v.trim().length > 0
    )
    return segments.length > 0 ? segments.join(", ") : "—"
}
