export const ADMISSION_REQUIREMENTS_CHECKLIST_DE_VARIABLE = "admission_requirements_checklist_de"
export const ADMISSION_REQUIREMENTS_CHECKLIST_EN_VARIABLE = "admission_requirements_checklist_en"
/** Legacy single-language variable — renders the English checklist. */
export const ADMISSION_REQUIREMENTS_CHECKLIST_VARIABLE = "admission_requirements_checklist"

export const CHECKLIST_DYNAMIC_VARIABLES = [
    ADMISSION_REQUIREMENTS_CHECKLIST_DE_VARIABLE,
    ADMISSION_REQUIREMENTS_CHECKLIST_EN_VARIABLE,
] as const

export const ADMISSION_REQUIREMENT_ITEMS = [
    {
        id: "tuition_payment",
        labelDe: "Zahlungsnachweis über die zu entrichtenden Studiengebühren",
        labelEn: "Proof of payment for tuition fees",
        proofType: "payment",
    },
    {
        id: "bachelor_authentication",
        labelDe: "Beglaubigung der Bachelorurkunde",
        labelEn: "Authentication of Bachelor's Degree",
        proofType: "document",
        documentCodes: ["BD_AD_DEGREE", "BD_AD_TRANSCRIPT"],
    },
    {
        id: "entrance_qualification",
        labelDe: "Nachweis Hochschulzugangsberechtigung",
        labelEn: "Proof of university entrance qualification",
        proofType: "document",
        documentCodes: ["HSC_UGD_CERTIFICATE", "HSC_UGD_MARKSHEET"],
    },
    {
        id: "aps_examination",
        labelDe: "Bestandene APS-Prüfung",
        labelEn: "Proof of successfully passed APS-examination",
        proofType: "document",
        documentCodes: ["APS"],
    },
    {
        id: "work_experience",
        labelDe: "Bestätigung einer qualifizierten beruflichen Erfahrung",
        labelEn: "Proof of qualified work experience",
        proofType: "document",
        documentCodes: ["WORK_EXP_LETTER"],
    },
    {
        id: "english_b2",
        labelDe: "Sprachnachweis English B2 (IELTS oder TOEFL)",
        labelEn: "Proof of English B2 certificate (IELTS or TOEFL)",
        proofType: "document",
        documentCodes: ["LANGUAGE_SCORE"],
    },
    {
        id: "secondary_school",
        labelDe: "Sekundarschulabschlusszeugnis und -Notenspiegel",
        labelEn: "Proof of Secondary school Certificate and Statement of Marks",
        proofType: "document",
        documentCodes: ["SSC_CERTIFICATE", "SSC_MARKSHEET"],
    },
] as const

export type AdmissionRequirementId = (typeof ADMISSION_REQUIREMENT_ITEMS)[number]["id"]

export type ChecklistLocale = "de" | "en"

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

export type ChecklistProofs = Partial<Record<AdmissionRequirementId, boolean>>

export const CHECKLIST_PROFILES = {
    international_four: [
        "tuition_payment",
        "bachelor_authentication",
        "aps_examination",
        "english_b2",
    ],
    full_six: [
        "tuition_payment",
        "bachelor_authentication",
        "entrance_qualification",
        "aps_examination",
        "work_experience",
        "english_b2",
    ],
    studienkolleg_five: [
        "tuition_payment",
        "entrance_qualification",
        "aps_examination",
        "english_b2",
        "secondary_school",
    ],
} as const satisfies Record<string, AdmissionRequirementId[]>

const APPROVED_DOCUMENT_STATUSES = new Set(["APPROVED", "VERIFIED"])

const ITEM_BY_ID = new Map(
    ADMISSION_REQUIREMENT_ITEMS.map((item) => [item.id, item] as const)
)

export function isAdmissionRequirementId(value: string): value is AdmissionRequirementId {
    return ITEM_BY_ID.has(value as AdmissionRequirementId)
}

export function parseChecklistItems(value: unknown): AdmissionRequirementId[] {
    if (!Array.isArray(value)) return []

    return value.filter((item): item is AdmissionRequirementId => {
        return typeof item === "string" && isAdmissionRequirementId(item)
    })
}

function isDocumentApproved(documents: StudentDocumentSnapshot[], codes: readonly string[]) {
    if (codes.length === 0) return false

    return codes.every((code) =>
        documents.some(
            (doc) =>
                doc.code === code &&
                doc.hasFiles &&
                doc.reviewStatus != null &&
                APPROVED_DOCUMENT_STATUSES.has(doc.reviewStatus)
        )
    )
}

export function evaluateChecklistItemFulfillment(
    itemId: AdmissionRequirementId,
    context: AdmissionRequirementsContext
): boolean {
    const item = ITEM_BY_ID.get(itemId)
    if (!item) return false

    if (item.proofType === "payment") {
        return context.paymentStatus === "CONFIRMED"
    }

    return isDocumentApproved(context.documents, item.documentCodes ?? [])
}

export function buildChecklistProofsSnapshot(
    context: AdmissionRequirementsContext,
    itemIds: AdmissionRequirementId[]
): ChecklistProofs {
    const proofs: ChecklistProofs = {}

    for (const itemId of itemIds) {
        proofs[itemId] = evaluateChecklistItemFulfillment(itemId, context)
    }

    return proofs
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

export function resolveChecklistItemIds(
    explicitItems: AdmissionRequirementId[] | null | undefined,
    context: AdmissionRequirementsContext,
    options?: { allowContextFallback?: boolean }
): AdmissionRequirementId[] {
    if (explicitItems && explicitItems.length > 0) {
        return explicitItems
    }

    if (options?.allowContextFallback) {
        return resolveVisibleAdmissionRequirementIds(context)
    }

    return []
}

export function evaluateAdmissionRequirements(
    context: AdmissionRequirementsContext,
    options?: {
        itemIds?: AdmissionRequirementId[] | null
        locale?: ChecklistLocale
        storedProofs?: ChecklistProofs | null
        allowContextFallback?: boolean
    }
): AdmissionRequirementEvaluation[] {
    const locale = options?.locale ?? "en"
    const itemIds = resolveChecklistItemIds(options?.itemIds, context, {
        allowContextFallback: options?.allowContextFallback,
    })

    return itemIds
        .map((itemId) => ITEM_BY_ID.get(itemId))
        .filter((item): item is (typeof ADMISSION_REQUIREMENT_ITEMS)[number] => Boolean(item))
        .map((item) => {
            const liveFulfilled = evaluateChecklistItemFulfillment(item.id, context)
            const storedFulfilled = options?.storedProofs?.[item.id]

            const fulfilled =
                item.proofType === "payment"
                    ? liveFulfilled || storedFulfilled === true
                    : liveFulfilled

            return {
                id: item.id,
                label: locale === "de" ? item.labelDe : item.labelEn,
                fulfilled,
            }
        })
}
