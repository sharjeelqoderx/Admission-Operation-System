import {
    ADMISSION_REQUIREMENTS_CHECKLIST_DE_VARIABLE,
    ADMISSION_REQUIREMENTS_CHECKLIST_EN_VARIABLE,
    ADMISSION_REQUIREMENTS_CHECKLIST_VARIABLE,
    ADMISSION_REQUIREMENT_ITEMS,
    CHECKLIST_DYNAMIC_VARIABLES,
    CHECKLIST_PROFILES,
    buildChecklistProofsSnapshot,
    evaluateAdmissionRequirements,
    evaluateChecklistItemFulfillment,
    isAdmissionRequirementId,
    parseChecklistItems,
    resolveChecklistItemIds,
    resolveVisibleAdmissionRequirementIds,
    type AdmissionRequirementEvaluation,
    type AdmissionRequirementsContext,
    type AdmissionRequirementId,
    type ChecklistLocale,
    type ChecklistProofs,
    type StudentDocumentSnapshot,
} from "@/lib/document-template/checklist-items"

export {
    ADMISSION_REQUIREMENTS_CHECKLIST_DE_VARIABLE,
    ADMISSION_REQUIREMENTS_CHECKLIST_EN_VARIABLE,
    ADMISSION_REQUIREMENTS_CHECKLIST_VARIABLE,
    ADMISSION_REQUIREMENT_ITEMS,
    CHECKLIST_DYNAMIC_VARIABLES,
    CHECKLIST_PROFILES,
    buildChecklistProofsSnapshot,
    evaluateAdmissionRequirements,
    evaluateChecklistItemFulfillment,
    isAdmissionRequirementId,
    parseChecklistItems,
    resolveChecklistItemIds,
    resolveVisibleAdmissionRequirementIds,
}

export type {
    AdmissionRequirementEvaluation,
    AdmissionRequirementId,
    AdmissionRequirementsContext,
    ChecklistLocale,
    ChecklistProofs,
    StudentDocumentSnapshot,
}

function buildCheckboxCell(checked: boolean) {
    const size = 14
    const stroke = 1.5
    const pad = stroke / 2
    const inner = size - stroke
    const cross = checked
        ? `<line x1="${pad + 1}" y1="${pad + 1}" x2="${size - pad - 1}" y2="${size - pad - 1}" stroke="#000000" stroke-width="${stroke}" stroke-linecap="square"/>
        <line x1="${size - pad - 1}" y1="${pad + 1}" x2="${pad + 1}" y2="${size - pad - 1}" stroke="#000000" stroke-width="${stroke}" stroke-linecap="square"/>`
        : ""

    return `<span class="requirement-checkbox${checked ? " requirement-checkbox--completed" : ""}" style="display:inline-block;width:${size}px;height:${size}px;min-width:${size}px;vertical-align:top;margin-top:2px;line-height:0;">
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true" style="display:block;">
            <rect x="${pad}" y="${pad}" width="${inner}" height="${inner}" fill="#ffffff" stroke="#000000" stroke-width="${stroke}"/>
            ${cross}
        </svg>
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

export function buildLocalizedChecklistHtml(
    context: AdmissionRequirementsContext,
    options?: {
        locale?: ChecklistLocale
        itemIds?: AdmissionRequirementId[] | null
        storedProofs?: ChecklistProofs | null
        allowContextFallback?: boolean
    }
) {
    const evaluations = evaluateAdmissionRequirements(context, options)
    return buildAdmissionRequirementsChecklistHtml(evaluations)
}

export function buildAdmissionRequirementsChecklistPreviewHtml(locale: ChecklistLocale = "en") {
    return buildLocalizedChecklistHtml(
        {
            paymentStatus: "CONFIRMED",
            apsRequirement: true,
            hasWorkExperience: false,
            requiresWorkExperience: true,
            documents: [
                { code: "BD_AD_DEGREE", reviewStatus: "APPROVED", hasFiles: true },
                { code: "BD_AD_TRANSCRIPT", reviewStatus: "APPROVED", hasFiles: true },
                { code: "APS", reviewStatus: "APPROVED", hasFiles: true },
            ],
        },
        {
            locale,
            itemIds: [
                "tuition_payment",
                "bachelor_authentication",
                "entrance_qualification",
                "aps_examination",
                "work_experience",
                "english_b2",
            ],
        }
    )
}
