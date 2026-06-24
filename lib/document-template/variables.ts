import {
    ADMISSION_REQUIREMENTS_CHECKLIST_DE_VARIABLE,
    ADMISSION_REQUIREMENTS_CHECKLIST_EN_VARIABLE,
    buildAdmissionRequirementsChecklistPreviewHtml,
} from "@/lib/document-template/admission-requirements-checklist"

export const TEMPLATE_MERGE_VARIABLES = [
    { key: "student_name", label: "Student Name" },
    { key: "student_title", label: "Student Title" },
    { key: "student_address", label: "Student Address" },
    { key: "student_date_of_birth", label: "Date of Birth" },
    { key: "student_signature", label: "Student Signature" },
    { key: "course_name", label: "Course Name" },
    { key: "degree_name", label: "Degree Name" },
    { key: "university_name", label: "University Name" },
    { key: "application_no", label: "Application Number" },
    { key: "issue_date", label: "Issue Date" },
    { key: "fees", label: "Fees" },
    { key: "intake_date", label: "Intake Date" },
    { key: "duration", label: "Course Duration" },
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
    options?: { alt?: string }
): string {
    const alt = options?.alt ?? "Student Signature"

    if (signatureUrl) {
        return `<img src="${signatureUrl}" alt="${alt}" class="document-student-signature" style="display:inline-block;max-width:180px;height:auto;object-fit:contain;background:transparent;" />`
    }

    return `<span class="document-student-signature-placeholder" style="display:inline-block;color:#9ca3af;font-style:italic;font-size:12px;">Signature not available</span>`
}

export const TEMPLATE_PREVIEW_SAMPLE_DATA: Record<string, string> = {
    student_name: "John Doe",
    student_title: "Mr.",
    student_address: "123 Academic Street<br />Berlin, BE 10115<br />Germany",
    student_date_of_birth: "January 15, 1998",
    student_signature: `<span class="document-student-signature-preview">${STUDENT_SIGNATURE_PREVIEW_SVG}</span>`,
    course_name: "Business Administration",
    degree_name: "Bachelor of Business",
    university_name: "Fachhochschule des Mittelstands",
    application_no: "APP-2026-001",
    issue_date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    }),
    fees: "€ 12,500",
    intake_date: "October 2026",
    duration: "3 years",
    [ADMISSION_REQUIREMENTS_CHECKLIST_DE_VARIABLE]: buildAdmissionRequirementsChecklistPreviewHtml("de"),
    [ADMISSION_REQUIREMENTS_CHECKLIST_EN_VARIABLE]: buildAdmissionRequirementsChecklistPreviewHtml("en"),
    admission_requirements_checklist: buildAdmissionRequirementsChecklistPreviewHtml("en"),
}

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
