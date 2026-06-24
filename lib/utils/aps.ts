import { STUDENT_DOCUMENT_TYPE_IDS } from "@/lib/constants/document-types"
import type { CourseDocumentTypeSummary, SplitCourseDocumentTypes } from "@/lib/utils/course-documents"

const APS_REQUIRED_COUNTRIES = new Set([
    "pakistan",
    "vietnam",
    "india",
    "china",
])

export const APS_DOCUMENT_TYPE_NAME = "APS Certificate"

/** True when student country is Pakistan, Vietnam, India, or China (case-insensitive). */
export function requiresApsRequirement(country: string | null | undefined): boolean {
    if (!country?.trim()) return false
    return APS_REQUIRED_COUNTRIES.has(country.trim().toLowerCase())
}

export function resolveApsDocumentType(
    documentTypes: Array<{ id: string; name: string }> = []
): CourseDocumentTypeSummary {
    return (
        documentTypes.find((documentType) => documentType.id === STUDENT_DOCUMENT_TYPE_IDS.APS) ?? {
            id: STUDENT_DOCUMENT_TYPE_IDS.APS,
            name: APS_DOCUMENT_TYPE_NAME,
        }
    )
}

/** Adds APS Certificate to required supporting documents for APS-country students. */
export function withApsRequiredDocument(
    split: SplitCourseDocumentTypes,
    country: string | null | undefined,
    apsDocumentType?: CourseDocumentTypeSummary | null
): SplitCourseDocumentTypes {
    if (!requiresApsRequirement(country)) {
        return split
    }

    const apsDoc = apsDocumentType ?? resolveApsDocumentType()

    if (split.required.some((documentType) => documentType.id === apsDoc.id)) {
        return split
    }

    return {
        required: [...split.required, apsDoc],
        optional: split.optional.filter((documentType) => documentType.id !== apsDoc.id),
    }
}

export function studentNeedsApsRequirement(input: {
    country?: string | null
    aps_requirement?: boolean | null
} | null | undefined): boolean {
    if (!input) return false
    if (input.aps_requirement) return true
    return requiresApsRequirement(input.country)
}

/** Ensures APS document type is included when fetching/filtering student documents. */
export function includeApsDocumentTypeIdIfRequired(
    documentTypeIds: string[],
    student: { country?: string | null; aps_requirement?: boolean | null } | null | undefined
): string[] {
    if (!studentNeedsApsRequirement(student)) {
        return documentTypeIds
    }

    if (documentTypeIds.includes(STUDENT_DOCUMENT_TYPE_IDS.APS)) {
        return documentTypeIds
    }

    return [...documentTypeIds, STUDENT_DOCUMENT_TYPE_IDS.APS]
}
