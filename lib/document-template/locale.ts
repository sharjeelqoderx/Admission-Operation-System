export type TemplateLocale = "de" | "en"
export type StudentTitle = "Mr" | "Mrs" | "Ms"

export const TEMPLATE_LOCALE_OPTIONS = [
    { value: "de" as const, label: "Deutsch (German)" },
    { value: "en" as const, label: "English" },
] as const

export const DEFAULT_TEMPLATE_LOCALE: TemplateLocale = "en"

export function normalizeTemplateLocale(value?: string | null): TemplateLocale {
    return value === "de" ? "de" : "en"
}

export function normalizeStudentTitle(value?: string | null): StudentTitle | null {
    const trimmed = value?.trim()
    if (trimmed === "Mr" || trimmed === "Mrs" || trimmed === "Ms") {
        return trimmed
    }
    return null
}

export function formatLocalizedTitle(
    title: StudentTitle | null,
    locale: TemplateLocale
): string {
    if (!title) return "—"

    if (locale === "de") {
        return title === "Mr" ? "Herr" : "Frau"
    }

    return title === "Mr" ? "Mr." : title === "Mrs" ? "Mrs." : "Ms."
}

export function buildStudentGreeting(params: {
    title?: string | null
    firstName?: string | null
    lastName?: string | null
    locale: TemplateLocale
}): string {
    const title = normalizeStudentTitle(params.title)
    const firstName = params.firstName?.trim() || ""
    const lastName = params.lastName?.trim() || ""
    const fullName = [firstName, lastName].filter(Boolean).join(" ") || "—"

    if (params.locale === "de") {
        if (title === "Mr") return `Sehr geehrter Herr ${fullName},`
        if (title === "Mrs" || title === "Ms") return `Sehr geehrte Frau ${fullName},`
        return `Sehr geehrte/r ${fullName},`
    }

    if (title === "Mr") return `Dear Mr. ${fullName},`
    if (title === "Mrs") return `Dear Mrs. ${fullName},`
    if (title === "Ms") return `Dear Ms. ${fullName},`
    return `Dear ${fullName},`
}

export function formatLocalizedDate(value: Date | string, locale: TemplateLocale): string {
    const parsed =
        value instanceof Date
            ? value
            : new Date(value.includes("T") ? value : `${value}T00:00:00`)

    if (Number.isNaN(parsed.getTime())) return "—"

    return parsed.toLocaleDateString(locale === "de" ? "de-DE" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })
}

export function formatLocalizedNumericDate(
    value: Date | string,
    locale: TemplateLocale
): string {
    const parsed =
        value instanceof Date
            ? value
            : new Date(value.includes("T") ? value : `${value}T00:00:00`)

    if (Number.isNaN(parsed.getTime())) return "—"

    return parsed.toLocaleDateString(locale === "de" ? "de-DE" : "en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    })
}

export function signatureNotAvailableLabel(locale: TemplateLocale): string {
    return locale === "de" ? "Unterschrift nicht verfügbar" : "Signature not available"
}

export const DEFAULT_HEADER_CONTACT_TEXT = {
    en: "FHM // International Office // Ravensberger Str. 10 G // 33602 Bielefeld",
    de: "FHM // Internationales Büro // Ravensberger Str. 10 G // 33602 Bielefeld",
} as const satisfies Record<TemplateLocale, string>

export function getDefaultHeaderContactText(locale: TemplateLocale): string {
    return DEFAULT_HEADER_CONTACT_TEXT[locale]
}

export function isDefaultHeaderContactText(value: string): boolean {
    const normalized = value.trim()
    return (
        normalized === DEFAULT_HEADER_CONTACT_TEXT.en ||
        normalized === DEFAULT_HEADER_CONTACT_TEXT.de
    )
}
