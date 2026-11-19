import type { TemplateLocale } from "@/lib/document-template/locale"

export type SemesterInfo = {
    season: "summer" | "winter"
    /** Summer: "2027". Winter: "2026/27". */
    yearLabel: string
}

function parseDate(value: string | null | undefined): Date | null {
    if (!value?.trim()) return null
    const parsed = new Date(value.includes("T") ? value : `${value}T00:00:00`)
    return Number.isNaN(parsed.getTime()) ? null : parsed
}

/**
 * Maps an intake start date to the German semester it belongs to.
 *
 * FHM intakes: February – August start in the summer semester (SoSe),
 * September – January start in the winter semester (WiSe).
 * Winter semesters span two calendar years: Sep 2026 – Jan 2027 → "2026/27".
 */
export function getSemesterForDate(value: string | null | undefined): SemesterInfo | null {
    const date = parseDate(value)
    if (!date) return null

    const month = date.getMonth() // 0 = Jan
    const year = date.getFullYear()

    if (month >= 1 && month <= 7) {
        return { season: "summer", yearLabel: String(year) }
    }

    const startYear = month === 0 ? year - 1 : year
    return {
        season: "winter",
        yearLabel: `${startYear}/${String((startYear + 1) % 100).padStart(2, "0")}`,
    }
}

export function formatSemesterLabel(info: SemesterInfo | null, locale: TemplateLocale): string {
    if (!info) return "—"
    if (locale === "de") {
        return `${info.season === "winter" ? "Wintersemester" : "Sommersemester"} ${info.yearLabel}`
    }
    return `${info.season} semester ${info.yearLabel}`
}

/**
 * Semester for a program that only stores a season (summer / winter) and no start date:
 * the next such semester after `referenceDate`.
 */
export function getUpcomingSemesterForSeason(
    season: string | null | undefined,
    referenceDate: Date | string | null | undefined
): SemesterInfo | null {
    if (season !== "summer" && season !== "winter") return null
    const ref =
        referenceDate instanceof Date ? referenceDate : parseDate(referenceDate ?? null) ?? new Date()
    const month = ref.getMonth()
    const year = ref.getFullYear()

    if (season === "summer") {
        return { season, yearLabel: String(month <= 7 ? year : year + 1) }
    }

    const startYear = month >= 10 ? year + 1 : year
    return { season, yearLabel: `${startYear}/${String((startYear + 1) % 100).padStart(2, "0")}` }
}

/** `{{semester_de}}` / `{{semester_en}}` for an intake date (or, failing that, an intake season). */
export function buildSemesterVariables(
    intakeDate: string | null | undefined,
    fallback?: { season?: string | null; referenceDate?: Date | string | null }
): { semester_de: string; semester_en: string } {
    const info =
        getSemesterForDate(intakeDate) ??
        getUpcomingSemesterForSeason(fallback?.season, fallback?.referenceDate)
    return {
        semester_de: formatSemesterLabel(info, "de"),
        semester_en: formatSemesterLabel(info, "en"),
    }
}
