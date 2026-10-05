import "server-only"

/**
 * FHM Logic_interactions JSON: dropdown codes → German labels (right-hand side in spec).
 * anrede | type_of_study_c (auspraegung/studienform) | Lcocation_c (studienort) |
 * studies_c (studiengang) | degree_parent_new_c (studienart) | Fieldofstudy_c (studienrichtung) |
 * Exam_venue_c (pruefungszentrum)
 */

export const SUGAR_ANREDE_BY_TITLE: Record<string, string> = {
    "": "",
    "Mr.": "Herr",
    Mr: "Herr",
    "Ms.": "Frau",
    Ms: "Frau",
    "Mrs.": "Frau",
    Mrs: "Frau",
    Divers: "Divers",
    Herr: "Herr",
    Frau: "Frau",
}

export const SUGAR_TYPE_OF_STUDY: Record<string, string> = {
    "": "",
    "100": "Vollzeitstudium",
    "200": "Berufsbegleitendes Studium (Teilzeit)",
    "300": "Fernstudium",
    "400": "Triales Studium",
    "500": "Duales Studium",
    "600": "Virtuelles Live-Studium",
    "700": "Weiterbildung",
    "800": "Berufsbegleitende Promotion",
    "900": "FHM-Studium in Kooperation",
}

export const SUGAR_LOCATION: Record<string, string> = {
    "": "",
    "100": "Bamberg",
    "200": "Berlin",
    "300": "Bielefeld",
    "1300": "Düren",
    "600": "Frechen (bei Köln)",
    "1700": "Frechen",
    "400": "Hannover",
    "500": "Köln",
    "700": "Rostock",
    "800": "Schwerin",
    "1200": "Online-University",
    "900": "München",
    "1000": "Wien",
    "1100": "Hoyerswerda",
    "1400": "Fernstudium in Kooperation",
    "1500": "Waldshut",
    "1800": "Studium in Kooperation",
    "1900": "Duales Studium in Kooperation",
    "2000": "Vollzeit in Kooperation",
}

export const SUGAR_DEGREE_LEVEL: Record<string, string> = {
    "": "",
    "100": "Bachelor",
    "200": "Master",
    "400": "Promotion",
    "500": "Weiterbildung (Teilzeit)",
}

export const SUGAR_FIELD_OF_STUDY: Record<string, string> = {
    "": "",
    "100": "Wirtschaft",
    "200": "Medien & Kommunikation",
    "300": "Gesundheit & Sport",
    "400": "Technologie",
    "500": "Pädagogik & Soziales",
    "600": "Psychologie",
}

/** Resolve Sugar dropdown value to its German label; pass through if already a label or unknown. */
export function resolveSugarLabel(
    map: Record<string, string>,
    raw: string | null | undefined
): string {
    const value = raw?.trim() ?? ""
    if (!value) return ""
    if (Object.prototype.hasOwnProperty.call(map, value)) {
        return map[value] ?? ""
    }
    const labels = new Set(Object.values(map))
    if (labels.has(value)) return value
    return value
}

export function mapSugarAnrede(title: string | null | undefined): string {
    const value = title?.trim() ?? ""
    if (!value) return ""
    return SUGAR_ANREDE_BY_TITLE[value] ?? value
}

const GERMAN_MONTHS = [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
] as const

export function formatSugarBirthDate(value: string | null | undefined): string {
    if (!value?.trim()) return ""
    const dateOnly = value.includes("T") ? value.slice(0, 10) : value.trim()
    return `${dateOnly} 01:00`
}

export function extractStudienjahr(value: string | null | undefined): string {
    if (!value?.trim()) return ""
    const match = value.match(/(20\d{2})/)
    return match?.[1] ?? ""
}

export function extractStudienstartMonth(value: string | null | undefined): string {
    if (!value?.trim()) return ""
    const parsed = new Date(value.includes("T") ? value : `${value}T12:00:00`)
    if (Number.isNaN(parsed.getTime())) {
        if (value.toLowerCase().includes("oct") || value === "10") return "Oktober"
        if (value.toLowerCase().includes("apr") || value === "4") return "April"
        return value
    }
    return GERMAN_MONTHS[parsed.getMonth()] ?? ""
}

export function mapStudyModeToStudienform(studyMode: string | null | undefined): string {
    if (!studyMode) return ""
    if (studyMode === "full_time") return resolveSugarLabel(SUGAR_TYPE_OF_STUDY, "100")
    if (studyMode === "part_time") return resolveSugarLabel(SUGAR_TYPE_OF_STUDY, "200")
    return resolveSugarLabel(SUGAR_TYPE_OF_STUDY, studyMode)
}
