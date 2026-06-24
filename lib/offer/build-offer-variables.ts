import {
    ADMISSION_REQUIREMENTS_CHECKLIST_DE_VARIABLE,
    ADMISSION_REQUIREMENTS_CHECKLIST_EN_VARIABLE,
    ADMISSION_REQUIREMENTS_CHECKLIST_VARIABLE,
    buildLocalizedChecklistHtml,
    type AdmissionRequirementsContext,
    type AdmissionRequirementId,
    type ChecklistProofs,
} from "@/lib/document-template/admission-requirements-checklist"
import { formatFullName } from "@/lib/utils/profile"
import { formatIntakeDate } from "@/lib/utils/program"
import { formatPostalAddress } from "@/lib/utils/location"
import { buildStudentSignatureHtml } from "@/lib/document-template/variables"

export type OfferStudentTemplateContext = {
    name?: string | null
    first_name?: string | null
    last_name?: string | null
    title?: string | null
    date_of_birth?: string | null
    signature?: string | null
    address?: string | null
    city?: string | null
    state?: string | null
    country?: string | null
    zip_code?: string | null
}

function formatStudentDateOfBirth(value?: string | null): string {
    if (!value?.trim()) return "—"

    const parsed = new Date(value.includes("T") ? value : `${value}T00:00:00`)
    if (Number.isNaN(parsed.getTime())) return "—"

    return parsed.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })
}

export type OfferApplicationContext = {
    application_no?: string | null
    student?: OfferStudentTemplateContext | null
    course?: {
        name?: string | null
        degree?: {
            name?: string | null
            fees?: string | null
            intake_date?: string | null
            duration?: string | null
        } | null
    } | null
    university?: {
        name?: string | null
        first_name?: string | null
        last_name?: string | null
    } | null
}

export type OfferChecklistOptions = {
    itemIds?: AdmissionRequirementId[] | null
    proofs?: ChecklistProofs | null
}

function buildChecklistVariables(
    requirementsContext: AdmissionRequirementsContext | undefined,
    checklistOptions?: OfferChecklistOptions
) {
    const context: AdmissionRequirementsContext =
        requirementsContext ??
        ({
            paymentStatus: null,
            apsRequirement: false,
            hasWorkExperience: false,
            requiresWorkExperience: false,
            documents: [],
        } satisfies AdmissionRequirementsContext)

    const checklistParams = {
        itemIds: checklistOptions?.itemIds,
        storedProofs: checklistOptions?.proofs,
    }

    return {
        [ADMISSION_REQUIREMENTS_CHECKLIST_DE_VARIABLE]: buildLocalizedChecklistHtml(context, {
            ...checklistParams,
            locale: "de",
        }),
        [ADMISSION_REQUIREMENTS_CHECKLIST_EN_VARIABLE]: buildLocalizedChecklistHtml(context, {
            ...checklistParams,
            locale: "en",
        }),
        [ADMISSION_REQUIREMENTS_CHECKLIST_VARIABLE]: buildLocalizedChecklistHtml(context, {
            ...checklistParams,
            locale: "en",
        }),
    }
}

export function buildOfferTemplateVariables(
    application: OfferApplicationContext,
    requirementsContext?: AdmissionRequirementsContext,
    checklistOptions?: OfferChecklistOptions
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
        student_title: application.student?.title?.trim() || "—",
        student_address: formatPostalAddress({
            address: application.student?.address,
            city: application.student?.city,
            state: application.student?.state,
            country: application.student?.country,
            zip_code: application.student?.zip_code,
        }),
        student_date_of_birth: formatStudentDateOfBirth(application.student?.date_of_birth),
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
        duration: application.course?.degree?.duration?.trim() || "—",
        ...buildChecklistVariables(requirementsContext, checklistOptions),
    }
}
