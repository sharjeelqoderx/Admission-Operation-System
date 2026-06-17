import { formatFullName } from "@/lib/utils/profile"
import { formatIntakeDate } from "@/lib/utils/program"
import { buildStudentSignatureHtml } from "@/lib/document-template/variables"

export type OfferApplicationContext = {
    application_no?: string | null
    student?: {
        name?: string | null
        first_name?: string | null
        last_name?: string | null
        signature?: string | null
    } | null
    course?: {
        name?: string | null
        degree?: {
            name?: string | null
            fees?: string | null
            intake_date?: string | null
        } | null
    } | null
    university?: {
        name?: string | null
        first_name?: string | null
        last_name?: string | null
    } | null
}

export function buildOfferTemplateVariables(
    application: OfferApplicationContext
): Record<string, string> {
    const studentName =
        application.student?.name ??
        formatFullName(
            application.student?.first_name,
            application.student?.last_name,
            "—"
        )

    const universityName =
        application.university?.name ??
        formatFullName(
            application.university?.first_name,
            application.university?.last_name,
            "University"
        )

    return {
        student_name: studentName,
        student_signature: buildStudentSignatureHtml(application.student?.signature, {
            alt: `${studentName} Signature`,
        }),
        course_name: application.course?.name ?? "—",
        degree_name: application.course?.degree?.name ?? "—",
        university_name: universityName,
        application_no: application.application_no ?? "—",
        issue_date: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        }),
        fees: application.course?.degree?.fees ?? "—",
        intake_date: formatIntakeDate(application.course?.degree?.intake_date) ?? "—",
    }
}
