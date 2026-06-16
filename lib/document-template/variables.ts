export const TEMPLATE_MERGE_VARIABLES = [
    { key: "student_name", label: "Student Name" },
    { key: "course_name", label: "Course Name" },
    { key: "degree_name", label: "Degree Name" },
    { key: "university_name", label: "University Name" },
    { key: "application_no", label: "Application Number" },
    { key: "issue_date", label: "Issue Date" },
    { key: "fees", label: "Fees" },
    { key: "intake_date", label: "Intake Date" },
] as const

export const TEMPLATE_PREVIEW_SAMPLE_DATA: Record<string, string> = {
    student_name: "John Doe",
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
}

export function extractTemplateVariables(html: string): string[] {
    const matches = html.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)
    return [...new Set([...matches].map((match) => match[1]))]
}

export function renderTemplateHtml(
    bodyHtml: string,
    variables: Record<string, string>
): string {
    return bodyHtml.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_full, key: string) => {
        return variables[key] ?? `{{${key}}}`
    })
}
