export const ADMISSION_REQUIREMENTS_CHECKLIST_VARIABLE = "admission_requirements_checklist"

export const ADMISSION_REQUIREMENT_ITEMS = [
    {
        id: "tuition_payment",
        label: "Proof of payment for tuition fees",
    },
    {
        id: "bachelor_authentication",
        label: "Authentication of Bachelor's Degree",
    },
    {
        id: "entrance_qualification",
        label: "Proof of university entrance qualification",
    },
    {
        id: "aps_examination",
        label: "Proof of successfully passed APS-examination",
    },
    {
        id: "work_experience",
        label: "Proof of qualified work experience",
    },
    {
        id: "english_b2",
        label: "Proof of English B2 certificate (IELTS or TOEFL)",
    },
] as const

export type AdmissionRequirementId = (typeof ADMISSION_REQUIREMENT_ITEMS)[number]["id"]

export type StudentDocumentSnapshot = {
    code: string | null
    reviewStatus: string | null
    hasFiles: boolean
}

export type AdmissionRequirementsContext = {
    paymentStatus: string | null
    apsRequirement: boolean
    hasWorkExperience: boolean
    documents: StudentDocumentSnapshot[]
}

export type AdmissionRequirementEvaluation = {
    id: AdmissionRequirementId
    label: string
    fulfilled: boolean
}

/** Document counts as present when the student has uploaded the required file(s). */
function isDocumentFulfilled(documents: StudentDocumentSnapshot[], codes: string[]) {
    return documents.some(
        (doc) => doc.code != null && codes.includes(doc.code) && doc.hasFiles
    )
}

export function evaluateAdmissionRequirements(
    context: AdmissionRequirementsContext
): AdmissionRequirementEvaluation[] {
    const { paymentStatus, apsRequirement, hasWorkExperience, documents } = context

    const fulfilledById: Record<AdmissionRequirementId, boolean> = {
        tuition_payment: paymentStatus === "CONFIRMED",
        bachelor_authentication: isDocumentFulfilled(documents, ["BD_AD_DEGREE", "BD_AD_TRANSCRIPT"]),
        entrance_qualification: isDocumentFulfilled(documents, [
            "HSC_UGD_CERTIFICATE",
            "HSC_UGD_MARKSHEET",
            "SSC_CERTIFICATE",
            "SSC_MARKSHEET",
        ]),
        aps_examination: !apsRequirement || isDocumentFulfilled(documents, ["APS"]),
        work_experience:
            hasWorkExperience || isDocumentFulfilled(documents, ["WORK_EXP_LETTER"]),
        english_b2: isDocumentFulfilled(documents, ["LANGUAGE_SCORE"]),
    }

    return ADMISSION_REQUIREMENT_ITEMS.map((item) => ({
        id: item.id,
        label: item.label,
        fulfilled: fulfilledById[item.id],
    }))
}

function buildCheckboxCell(checked: boolean) {
    const size = 14
    const border = 1.5
    const inset = 2

    if (!checked) {
        return `<span class="requirement-checkbox" style="display:inline-block;width:${size}px;height:${size}px;min-width:${size}px;border:${border}px solid #000000;box-sizing:border-box;vertical-align:top;margin-top:2px;background:#ffffff;"></span>`
    }

    return `<span class="requirement-checkbox requirement-checkbox--completed" style="display:inline-block;width:${size}px;height:${size}px;min-width:${size}px;border:${border}px solid #000000;box-sizing:border-box;vertical-align:top;margin-top:2px;padding:${inset}px;background:#ffffff;">
        <span style="display:block;width:100%;height:100%;background:#000000;box-sizing:border-box;"></span>
    </span>`
}

function buildChecklistRow(item: AdmissionRequirementEvaluation) {
    return `
        <div class="requirement-checklist-row" style="display:flex;align-items:flex-start;gap:12px;padding:7px 0;">
            ${buildCheckboxCell(item.fulfilled)}
            <span style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.45;color:#000000;">${item.label}</span>
        </div>`
}

export function buildAdmissionRequirementsChecklistHtml(
    evaluations: AdmissionRequirementEvaluation[]
) {
    const rows = evaluations.map((item) => buildChecklistRow(item)).join("")

    return `<div class="document-requirements-checklist" style="margin:18px 0;">
        <div style="display:flex;flex-direction:column;gap:0;">${rows}</div>
    </div>`
}

export function buildAdmissionRequirementsChecklistPreviewHtml() {
    const previewEvaluations: AdmissionRequirementEvaluation[] = [
        { id: "tuition_payment", label: ADMISSION_REQUIREMENT_ITEMS[0].label, fulfilled: true },
        { id: "bachelor_authentication", label: ADMISSION_REQUIREMENT_ITEMS[1].label, fulfilled: true },
        {
            id: "entrance_qualification",
            label: ADMISSION_REQUIREMENT_ITEMS[2].label,
            fulfilled: false,
        },
        { id: "aps_examination", label: ADMISSION_REQUIREMENT_ITEMS[3].label, fulfilled: true },
        { id: "work_experience", label: ADMISSION_REQUIREMENT_ITEMS[4].label, fulfilled: false },
        { id: "english_b2", label: ADMISSION_REQUIREMENT_ITEMS[5].label, fulfilled: false },
    ]

    return buildAdmissionRequirementsChecklistHtml(previewEvaluations)
}
