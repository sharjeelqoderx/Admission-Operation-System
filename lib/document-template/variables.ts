import {
    getPageBreakMarkerLang,
    DOCUMENT_PAGE_BREAK_MARKER_REGEX,
} from "@/lib/document-template/a4-document"
import type { AdmissionRequirementId } from "@/lib/document-template/checklist-items"
import {
    buildTemplateDatePreviewSampleData,
    buildTemplateDateVariables,
    type DocumentTemplateDates,
} from "@/lib/document-template/date-variables"
import {
    ADMISSION_REQUIREMENTS_CHECKLIST_DE_VARIABLE,
    ADMISSION_REQUIREMENTS_CHECKLIST_EN_VARIABLE,
    buildAdmissionRequirementsChecklistPreviewHtml,
} from "@/lib/document-template/admission-requirements-checklist"
import {
    buildStudentGreeting,
    formatLocalizedTitle,
    normalizeStudentTitle,
    signatureNotAvailableLabel,
    type TemplateLocale,
} from "@/lib/document-template/locale"

export const TEMPLATE_GREETING_VARIABLES = [
    {
        key: "student_greeting",
        label: "Salutation (follows template language)",
        description:
            "Full greeting line, e.g. Sehr geehrter Herr Max Mustermann, or Dear Mr. John Doe,",
    },
    {
        key: "student_greeting_de",
        label: "Salutation (German only)",
        description: "Always German: Sehr geehrter Herr / Sehr geehrte Frau …",
    },
    {
        key: "student_greeting_en",
        label: "Salutation (English only)",
        description: "Always English: Dear Mr. / Dear Mrs. / Dear Ms. …",
    },
    { key: "student_first_name", label: "First Name" },
    { key: "student_last_name", label: "Last Name" },
    {
        key: "student_title",
        label: "Title (follows template language)",
        description: "Herr/Frau in German, Mr./Mrs./Ms. in English",
    },
    { key: "student_name", label: "Full Name" },
] as const

export const TEMPLATE_MERGE_VARIABLES = [
    ...TEMPLATE_GREETING_VARIABLES,
    { key: "student_address", label: "Student Address" },
    { key: "student_signature", label: "Student Signature" },
    { key: "course_name", label: "Course Name" },
    { key: "degree_name", label: "Degree Name" },
    { key: "university_name", label: "University Name" },
    { key: "application_no", label: "Application Number" },
    { key: "fees", label: "Fees" },
    { key: "duration", label: "Course Duration" },
    {
        key: "campus",
        label: "Campus",
        description: "Campus of the applied program, e.g. Berlin, Düren or Frechen.",
    },
    {
        key: "semester_de",
        label: "Semester (German)",
        description: "Intake semester in German, e.g. Wintersemester 2026/27.",
    },
    {
        key: "semester_en",
        label: "Semester (English)",
        description: "Intake semester in English, e.g. winter semester 2026/27.",
    },
] as const

export const TEMPLATE_DYNAMIC_SECTIONS = [
    {
        key: ADMISSION_REQUIREMENTS_CHECKLIST_DE_VARIABLE,
        label: "Admission checklist (German)",
        description:
            "German checklist rows from document_template.checklist_items (4–6 items). Document rows auto-check when approved; tuition uses payment proof.",
    },
    {
        key: ADMISSION_REQUIREMENTS_CHECKLIST_EN_VARIABLE,
        label: "Admission checklist (English)",
        description:
            "English checklist rows from document_template.checklist_items (4–6 items). Document rows auto-check when approved; tuition uses payment proof.",
    },
] as const

const STUDENT_SIGNATURE_PREVIEW_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="48" viewBox="0 0 160 48" aria-hidden="true"><path d="M8 32 C24 8, 40 40, 56 24 S88 8, 104 28 S128 36, 152 20" fill="none" stroke="#374151" stroke-width="2" stroke-linecap="round"/></svg>`

export function buildStudentSignatureHtml(
    signatureUrl?: string | null,
    options?: { alt?: string; locale?: TemplateLocale }
): string {
    const alt = options?.alt ?? "Student Signature"
    const locale = options?.locale ?? "en"

    if (signatureUrl) {
        return `<img src="${signatureUrl}" alt="${alt}" class="document-student-signature" style="display:inline-block;max-width:180px;height:auto;object-fit:contain;background:transparent;" />`
    }

    return `<span class="document-student-signature-placeholder" style="display:inline-block;color:#9ca3af;font-style:italic;font-size:12px;">${signatureNotAvailableLabel(locale)}</span>`
}

export type TemplatePreviewProgram = {
    /** Full program name, e.g. "International Technology Transfer Management (Master of Science)". */
    name: string
    campus?: string | null
    category?: string | null
}

export type TemplatePreviewOptions = {
    /** The template's own checklist rows (so a Bachelor template previews a Bachelor checklist). */
    checklistItems?: AdmissionRequirementId[] | null
    /** A program linked to the template — its real name / campus are used instead of dummy text. */
    program?: TemplatePreviewProgram | null
}

function buildPreviewProgramVariables(
    locale: TemplateLocale,
    program?: TemplatePreviewProgram | null
): Record<string, string> {
    if (program?.name) {
        // "Name (Master of Science)" → course "Name", degree "Master of Science".
        const match = program.name.match(/^(.*?)\s*\(([^)]+)\)\s*$/)
        return {
            course_name: match ? match[1].trim() : program.name,
            degree_name: match ? match[2].trim() : program.category || "—",
            campus: program.campus?.trim() || "—",
        }
    }

    return {
        course_name: locale === "de" ? "Beispiel-Studiengang" : "Sample Program",
        degree_name: locale === "de" ? "Abschluss" : "Degree",
        campus: "Frechen",
    }
}

export function buildTemplatePreviewSampleData(
    locale: TemplateLocale = "en",
    templateDates?: DocumentTemplateDates | null,
    options?: TemplatePreviewOptions
): Record<string, string> {
    const firstName = locale === "de" ? "Max" : "John"
    const lastName = locale === "de" ? "Mustermann" : "Doe"
    const studentName = `${firstName} ${lastName}`
    const sampleTitle = "Mr" as const

    return {
        student_greeting: buildStudentGreeting({
            title: sampleTitle,
            firstName,
            lastName,
            locale,
        }),
        student_greeting_de: buildStudentGreeting({
            title: sampleTitle,
            firstName,
            lastName,
            locale: "de",
        }),
        student_greeting_en: buildStudentGreeting({
            title: sampleTitle,
            firstName,
            lastName,
            locale: "en",
        }),
        student_first_name: firstName,
        student_last_name: lastName,
        student_name: studentName,
        student_title: formatLocalizedTitle(sampleTitle, locale),
        student_address:
            locale === "de"
                ? "Musterstraße 123<br />Wohnung 4B<br />Gebäude C<br />Berlin, 10115<br />Deutschland"
                : "123 Academic Street<br />Suite 4B<br />Building C<br />Berlin, BE 10115<br />Germany",
        student_signature: `<span class="document-student-signature-preview">${STUDENT_SIGNATURE_PREVIEW_SVG}</span>`,
        ...buildPreviewProgramVariables(locale, options?.program),
        university_name: "Fachhochschule des Mittelstands",
        application_no: "APP-2026-001",
        fees: "€ 12,500",
        duration: locale === "de" ? "3 Jahre" : "3 years",
        semester_de: "Wintersemester 2026/27",
        semester_en: "winter semester 2026/27",
        ...(templateDates &&
        Object.values(templateDates).some(
            (value) => typeof value === "string" && value.trim().length > 0
        )
            ? buildTemplateDateVariables({
                  locale,
                  issueDate: "2026-02-01",
                  studentDateOfBirth: "1998-01-15",
                  applicationDeadline: "2026-01-15",
                  intakeStartDate: templateDates.program_period_start,
                  duration: "4 years",
                  templateDates,
              })
            : buildTemplateDatePreviewSampleData(locale)),
        [ADMISSION_REQUIREMENTS_CHECKLIST_DE_VARIABLE]:
            buildAdmissionRequirementsChecklistPreviewHtml("de", options?.checklistItems),
        [ADMISSION_REQUIREMENTS_CHECKLIST_EN_VARIABLE]:
            buildAdmissionRequirementsChecklistPreviewHtml("en", options?.checklistItems),
        admission_requirements_checklist: buildAdmissionRequirementsChecklistPreviewHtml(
            locale,
            options?.checklistItems
        ),
    }
}

/** @deprecated Use buildTemplatePreviewSampleData(locale) for locale-aware preview. */
export const TEMPLATE_PREVIEW_SAMPLE_DATA: Record<string, string> =
    buildTemplatePreviewSampleData("en")

export function extractTemplateVariables(html: string): string[] {
    const matches = html.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)
    return [...new Set([...matches].map((match) => match[1]))]
}

function getEnclosingTextAlign(
    html: string,
    variableOffset: number
): "left" | "center" | "right" | null {
    const before = html.slice(0, variableOffset)
    const tagPattern = /<(p|div|h[1-6]|td|th|li|blockquote)(\s[^>]*)?>/gi
    let lastTag: RegExpExecArray | null = null
    let match: RegExpExecArray | null = null

    while ((match = tagPattern.exec(before)) !== null) {
        lastTag = match
    }

    if (!lastTag) return null

    const attrs = lastTag[2] ?? ""
    const styleMatch = attrs.match(/style="([^"]*)"/i)
    const style = styleMatch?.[1] ?? attrs
    const alignMatch = style.match(/text-align\s*:\s*(center|right|left)/i)

    if (!alignMatch) return null

    return alignMatch[1].toLowerCase() as "left" | "center" | "right"
}

function wrapForTextAlign(html: string, align: "center" | "right"): string {
    if (html.includes('class="template-aligned-block"')) {
        return html
    }

    return `<span class="template-aligned-block template-aligned-block--${align}" style="display:inline-block;text-align:left;vertical-align:top;max-width:100%;">${html}</span>`
}

export function renderTemplateHtml(
    bodyHtml: string,
    variables: Record<string, string>
): string {
    return bodyHtml.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (full, key: string, offset: number) => {
        const value = variables[key]
        if (value == null) return full

        const align = getEnclosingTextAlign(bodyHtml, offset)
        if (align === "center" || align === "right") {
            return wrapForTextAlign(value, align)
        }

        return value
    })
}

const PAGE_BREAK_SPLIT_REGEX = new RegExp(`(${DOCUMENT_PAGE_BREAK_MARKER_REGEX.source})`, "gi")

/**
 * Renders merge variables page by page: each page is rendered with the variables of
 * its own language (set on the page break that starts it), so an English page gets
 * English dates / titles / greetings even inside a German template.
 */
export function renderTemplateHtmlByPageLocale(
    bodyHtml: string,
    getVariables: (locale: TemplateLocale) => Record<string, string>,
    templateLocale: TemplateLocale
): string {
    const cache = new Map<TemplateLocale, Record<string, string>>()
    const variablesFor = (locale: TemplateLocale) => {
        const cached = cache.get(locale)
        if (cached) return cached
        const built = getVariables(locale)
        cache.set(locale, built)
        return built
    }

    const tokens = bodyHtml.split(PAGE_BREAK_SPLIT_REGEX)
    let current = templateLocale
    let out = renderTemplateHtml(tokens[0], variablesFor(current))

    for (let index = 1; index < tokens.length; index += 2) {
        const marker = tokens[index]
        current = getPageBreakMarkerLang(marker) ?? current
        out += marker + renderTemplateHtml(tokens[index + 1] ?? "", variablesFor(current))
    }

    return out
}
