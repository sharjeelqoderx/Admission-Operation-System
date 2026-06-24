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
    requiresWorkExperience: boolean
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

export function resolveVisibleAdmissionRequirementIds(
    context: AdmissionRequirementsContext
): AdmissionRequirementId[] {
    const alwaysVisible: AdmissionRequirementId[] = [
        "tuition_payment",
        "bachelor_authentication",
        "entrance_qualification",
        "english_b2",
    ]

    const conditional: AdmissionRequirementId[] = []

    if (context.apsRequirement) {
        conditional.push("aps_examination")
    }

    if (context.requiresWorkExperience || context.hasWorkExperience) {
        conditional.push("work_experience")
    }

    return [...alwaysVisible, ...conditional]
}

export function evaluateAdmissionRequirements(
    context: AdmissionRequirementsContext
): AdmissionRequirementEvaluation[] {
    const { paymentStatus, documents } = context

    const fulfilledById: Record<AdmissionRequirementId, boolean> = {
        tuition_payment: paymentStatus === "CONFIRMED",
        bachelor_authentication: isDocumentFulfilled(documents, ["BD_AD_DEGREE", "BD_AD_TRANSCRIPT"]),
        entrance_qualification: isDocumentFulfilled(documents, [
            "HSC_UGD_CERTIFICATE",
            "HSC_UGD_MARKSHEET",
            "SSC_CERTIFICATE",
            "SSC_MARKSHEET",
        ]),
        aps_examination: isDocumentFulfilled(documents, ["APS"]),
        work_experience: isDocumentFulfilled(documents, ["WORK_EXP_LETTER"]),
        english_b2: isDocumentFulfilled(documents, ["LANGUAGE_SCORE"]),
    }

    const visibleIds = resolveVisibleAdmissionRequirementIds(context)

    return ADMISSION_REQUIREMENT_ITEMS.filter((item) => visibleIds.includes(item.id)).map(
        (item) => ({
            id: item.id,
            label: item.label,
            fulfilled: fulfilledById[item.id],
        })
    )
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
        <span class="requirement-checklist-row" style="display:flex;align-items:flex-start;gap:4px;padding:2px 0;">
            ${buildCheckboxCell(item.fulfilled)}
            <span style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.35;color:#000000;">${item.label}</span>
        </span>`
}

export function buildAdmissionRequirementsChecklistHtml(
    evaluations: AdmissionRequirementEvaluation[]
) {
    const rows = evaluations.map((item) => buildChecklistRow(item)).join("")

    return `<span class="document-requirements-checklist" style="display:inline-block;text-align:left;vertical-align:top;margin:10px 0;max-width:100%;">
        <span class="document-requirements-checklist-rows" style="display:flex;flex-direction:column;gap:0;">${rows}</span>
    </span>`
}

export function buildAdmissionRequirementsChecklistPreviewHtml() {
    const previewEvaluations = evaluateAdmissionRequirements({
        paymentStatus: "CONFIRMED",
        apsRequirement: true,
        hasWorkExperience: false,
        requiresWorkExperience: true,
        documents: [
            { code: "BD_AD_DEGREE", reviewStatus: null, hasFiles: true },
            { code: "BD_AD_TRANSCRIPT", reviewStatus: null, hasFiles: true },
            { code: "APS", reviewStatus: null, hasFiles: true },
        ],
    })

    return buildAdmissionRequirementsChecklistHtml(previewEvaluations)
}
