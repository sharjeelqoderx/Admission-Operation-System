import {
    formatLocalizedDate,
    formatLocalizedNumericDate,
    type TemplateLocale,
} from "@/lib/document-template/locale"

export type DocumentTemplateDates = {
    program_period_start?: string | null
    program_period_end?: string | null
    classes_start_date?: string | null
    enrollment_start_date?: string | null
    enrollment_end_date?: string | null
    visa_participation_deadline?: string | null
}

export const EMPTY_DOCUMENT_TEMPLATE_DATES: DocumentTemplateDates = {
    program_period_start: null,
    program_period_end: null,
    classes_start_date: null,
    enrollment_start_date: null,
    enrollment_end_date: null,
    visa_participation_deadline: null,
}

export const TEMPLATE_DATE_VARIABLES = [
    {
        key: "issue_date",
        labelDe: "Ausstellungsdatum",
        labelEn: "Issue date",
        description: "Date the offer letter is issued.",
        source: "auto" as const,
    },
    {
        key: "student_date_of_birth",
        labelDe: "Geburtsdatum",
        labelEn: "Date of birth",
        description: "Student date of birth from profile.",
        source: "auto" as const,
    },
    {
        key: "application_deadline",
        labelDe: "Bewerbungsfrist",
        labelEn: "Application deadline",
        description: "Course application deadline from program data.",
        source: "auto" as const,
    },
    {
        key: "intake_start_date",
        labelDe: "Programmbeginn",
        labelEn: "Intake start date",
        description: "Program intake start date from degree data.",
        source: "auto" as const,
    },
    {
        key: "program_period",
        labelDe: "Programmzeitraum",
        labelEn: "Program period",
        description: "Date range for the full program (configure below or derived from intake + duration).",
        source: "template" as const,
    },
    {
        key: "classes_start_date",
        labelDe: "Beginn der Lehrveranstaltungen",
        labelEn: "Classes start date",
        description: "First day of classes (configure in Letter dates below).",
        source: "template" as const,
    },
    {
        key: "enrollment_period",
        labelDe: "Einschreibung",
        labelEn: "Enrollment period",
        description: "Enrollment window (configure start and end in Letter dates below).",
        source: "template" as const,
    },
    {
        key: "visa_participation_deadline",
        labelDe: "Teilnahme bei Visum-Verzögerung bis",
        labelEn: "Visa delay participation deadline",
        description: "Latest date to join if visa processing is delayed.",
        source: "template" as const,
    },
] as const

export type TemplateDateVariableKey = (typeof TEMPLATE_DATE_VARIABLES)[number]["key"]

type TemplateDateConfigKey = keyof DocumentTemplateDates

export type TemplateDateInsertOption = {
    id: string
    mergeKey: TemplateDateVariableKey
    configKey?: TemplateDateConfigKey
    labelDe: string
    labelEn: string
}

/** Dropdown options: pick field → set date (if needed) → insert into template. */
export const TEMPLATE_DATE_INSERT_OPTIONS: TemplateDateInsertOption[] = [
    {
        id: "issue_date",
        mergeKey: "issue_date",
        labelDe: "Ausstellungsdatum",
        labelEn: "Issue date",
    },
    {
        id: "student_date_of_birth",
        mergeKey: "student_date_of_birth",
        labelDe: "Geburtsdatum",
        labelEn: "Date of birth",
    },
    {
        id: "application_deadline",
        mergeKey: "application_deadline",
        labelDe: "Bewerbungsfrist",
        labelEn: "Application deadline",
    },
    {
        id: "intake_start_date",
        mergeKey: "intake_start_date",
        labelDe: "Programmbeginn",
        labelEn: "Intake start date",
    },
    {
        id: "program_period_start",
        mergeKey: "program_period",
        configKey: "program_period_start",
        labelDe: "Programmzeitraum – Start",
        labelEn: "Program period – start",
    },
    {
        id: "program_period_end",
        mergeKey: "program_period",
        configKey: "program_period_end",
        labelDe: "Programmzeitraum – Ende",
        labelEn: "Program period – end",
    },
    {
        id: "classes_start_date",
        mergeKey: "classes_start_date",
        configKey: "classes_start_date",
        labelDe: "Beginn der Lehrveranstaltungen",
        labelEn: "Classes start date",
    },
    {
        id: "enrollment_start_date",
        mergeKey: "enrollment_period",
        configKey: "enrollment_start_date",
        labelDe: "Einschreibung – Start",
        labelEn: "Enrollment – start",
    },
    {
        id: "enrollment_end_date",
        mergeKey: "enrollment_period",
        configKey: "enrollment_end_date",
        labelDe: "Einschreibung – Ende",
        labelEn: "Enrollment – end",
    },
    {
        id: "visa_participation_deadline",
        mergeKey: "visa_participation_deadline",
        configKey: "visa_participation_deadline",
        labelDe: "Visum-Teilnahme bis",
        labelEn: "Visa participation until",
    },
]

export function getTemplateDateInsertOptionLabel(
    option: TemplateDateInsertOption,
    locale: TemplateLocale
): string {
    return locale === "de" ? option.labelDe : option.labelEn
}

export function getTemplateDateInsertOptionById(id: string): TemplateDateInsertOption | undefined {
    return TEMPLATE_DATE_INSERT_OPTIONS.find((option) => option.id === id)
}

export function getTemplateDateVariableLabel(
    key: TemplateDateVariableKey,
    locale: TemplateLocale
): string {
    const item = TEMPLATE_DATE_VARIABLES.find((entry) => entry.key === key)
    if (!item) return key
    return locale === "de" ? item.labelDe : item.labelEn
}

export function parseDocumentTemplateDates(value: unknown): DocumentTemplateDates {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return { ...EMPTY_DOCUMENT_TEMPLATE_DATES }
    }

    const record = value as Record<string, unknown>

    return {
        program_period_start:
            typeof record.program_period_start === "string" ? record.program_period_start : null,
        program_period_end:
            typeof record.program_period_end === "string" ? record.program_period_end : null,
        classes_start_date:
            typeof record.classes_start_date === "string" ? record.classes_start_date : null,
        enrollment_start_date:
            typeof record.enrollment_start_date === "string" ? record.enrollment_start_date : null,
        enrollment_end_date:
            typeof record.enrollment_end_date === "string" ? record.enrollment_end_date : null,
        visa_participation_deadline:
            typeof record.visa_participation_deadline === "string"
                ? record.visa_participation_deadline
                : null,
    }
}

function parseDurationYears(duration?: string | null): number | null {
    if (!duration?.trim()) return null

    const match = duration.match(/(\d+(?:[.,]\d+)?)/)
    if (!match) return null

    const years = Number.parseFloat(match[1].replace(",", "."))
    return Number.isFinite(years) ? years : null
}

function addYearsToDate(value: string, years: number): string | null {
    const parsed = new Date(value.includes("T") ? value : `${value}T00:00:00`)
    if (Number.isNaN(parsed.getTime())) return null

    const copy = new Date(parsed)
    copy.setFullYear(copy.getFullYear() + Math.round(years))
    copy.setDate(copy.getDate() - 1)
    return copy.toISOString().slice(0, 10)
}

function formatOptionalDate(
    value: string | null | undefined,
    locale: TemplateLocale,
    style: "long" | "numeric" = "long"
): string | null {
    if (!value?.trim()) return null
    return style === "numeric"
        ? formatLocalizedNumericDate(value, locale)
        : formatLocalizedDate(value, locale)
}

function formatOptionalDateRange(
    start: string | null | undefined,
    end: string | null | undefined,
    locale: TemplateLocale
): string | null {
    const formattedStart = formatOptionalDate(start, locale, "numeric")
    const formattedEnd = formatOptionalDate(end, locale, "numeric")

    if (formattedStart && formattedEnd) {
        return `${formattedStart} – ${formattedEnd}`
    }

    return formattedStart ?? formattedEnd
}

export type BuildTemplateDateVariablesInput = {
    locale: TemplateLocale
    issueDate?: Date | string | null
    studentDateOfBirth?: string | null
    applicationDeadline?: string | null
    intakeStartDate?: string | null
    duration?: string | null
    templateDates?: DocumentTemplateDates | null
}

export function buildTemplateDateVariables(
    input: BuildTemplateDateVariablesInput
): Record<string, string> {
    const locale = input.locale
    const templateDates = input.templateDates ?? EMPTY_DOCUMENT_TEMPLATE_DATES

    const programPeriodStart =
        templateDates.program_period_start?.trim() ||
        input.intakeStartDate?.trim() ||
        null

    const programPeriodEnd =
        templateDates.program_period_end?.trim() ||
        (programPeriodStart && input.duration
            ? addYearsToDate(programPeriodStart, parseDurationYears(input.duration) ?? 0)
            : null)

    const programPeriod = formatOptionalDateRange(programPeriodStart, programPeriodEnd, locale)

    const enrollmentPeriod = formatOptionalDateRange(
        templateDates.enrollment_start_date,
        templateDates.enrollment_end_date,
        locale
    )

    const issueDateSource = input.issueDate ?? new Date()

    return {
        issue_date: formatLocalizedDate(issueDateSource, locale),
        student_date_of_birth: input.studentDateOfBirth?.trim()
            ? formatLocalizedDate(input.studentDateOfBirth, locale)
            : "—",
        application_deadline: formatOptionalDate(input.applicationDeadline, locale, "numeric") ?? "—",
        intake_start_date: formatOptionalDate(input.intakeStartDate, locale, "numeric") ?? "—",
        program_period: programPeriod ?? "—",
        classes_start_date:
            formatOptionalDate(templateDates.classes_start_date, locale, "numeric") ?? "—",
        enrollment_period: enrollmentPeriod ?? "—",
        visa_participation_deadline:
            formatOptionalDate(templateDates.visa_participation_deadline, locale, "long") ?? "—",
    }
}

export function buildTemplateDatePreviewSampleData(locale: TemplateLocale): Record<string, string> {
    return buildTemplateDateVariables({
        locale,
        issueDate: "2026-02-01",
        studentDateOfBirth: "1998-01-15",
        applicationDeadline: "2026-01-15",
        intakeStartDate: "2026-02-01",
        duration: "4 years",
        templateDates: {
            program_period_start: "2026-02-01",
            program_period_end: "2030-01-31",
            classes_start_date: "2026-02-17",
            enrollment_start_date: "2026-02-01",
            enrollment_end_date: "2026-02-13",
            visa_participation_deadline: "2026-04-30",
        },
    })
}
