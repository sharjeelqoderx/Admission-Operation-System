import {
    CHECKLIST_PROFILES,
    parseChecklistItems,
    type AdmissionRequirementId,
} from "@/lib/document-template/checklist-items"

export type ChecklistProfileKey = keyof typeof CHECKLIST_PROFILES

export function isChecklistProfileKey(value: string): value is ChecklistProfileKey {
    return value in CHECKLIST_PROFILES
}

export function resolveTemplateChecklistItems(input: {
    checklistItems?: unknown
    checklistProfile?: string | null
}): AdmissionRequirementId[] {
    const fromItems = parseChecklistItems(input.checklistItems)
    if (fromItems.length > 0) {
        return fromItems
    }

    const profile = input.checklistProfile?.trim()
    if (profile && isChecklistProfileKey(profile)) {
        return [...CHECKLIST_PROFILES[profile]]
    }

    return []
}

export function resolveOfferChecklistItems(input: {
    offerChecklistItems?: unknown
    templateChecklistItems?: unknown
    templateChecklistProfile?: string | null
}): AdmissionRequirementId[] {
    const fromOffer = parseChecklistItems(input.offerChecklistItems)
    if (fromOffer.length > 0) {
        return fromOffer
    }

    return resolveTemplateChecklistItems({
        checklistItems: input.templateChecklistItems,
        checklistProfile: input.templateChecklistProfile,
    })
}

export const CHECKLIST_PROFILE_OPTIONS: {
    key: ChecklistProfileKey
    label: string
    itemCount: number
}[] = [
    { key: "international_four", label: "International (4 items)", itemCount: 4 },
    { key: "full_six", label: "Full admission (6 items)", itemCount: 6 },
    { key: "studienkolleg_five", label: "Studienkolleg (5 items)", itemCount: 5 },
]
