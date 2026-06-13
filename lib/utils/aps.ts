const APS_REQUIRED_COUNTRIES = new Set([
    "pakistan",
    "vietnam",
    "india",
    "china",
])

/** True when student country is Pakistan, Vietnam, India, or China (case-insensitive). */
export function requiresApsRequirement(country: string | null | undefined): boolean {
    if (!country?.trim()) return false
    return APS_REQUIRED_COUNTRIES.has(country.trim().toLowerCase())
}
