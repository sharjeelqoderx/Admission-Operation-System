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
