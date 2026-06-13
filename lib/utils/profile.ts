export function formatFullName(
    firstName?: string | null,
    lastName?: string | null,
    fallback = ""
): string {
    const parts = [firstName?.trim(), lastName?.trim()].filter(Boolean)
    return parts.length > 0 ? parts.join(" ") : fallback
}

type ProfileNameFields = {
    first_name?: string | null
    last_name?: string | null
}

export function withProfileDisplayName<T extends ProfileNameFields | null>(
    profile: T
): (T & { name: string }) | null {
    if (!profile) return null
    return {
        ...profile,
        name: formatFullName(profile.first_name, profile.last_name, "—"),
    }
}
