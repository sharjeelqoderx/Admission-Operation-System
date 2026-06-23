import type { Database } from "@/types/supabase"

export type DocumentRequirementType = Database["public"]["Enums"]["document_requirement_type_enum"]

export type CourseDocumentTypeSummary = {
    id: string
    name: string
}

export type CourseRequirementLike = {
    requirement_type?: DocumentRequirementType | null
    document_type?: { id?: string; name?: string } | null
}

export type SplitCourseDocumentTypes = {
    required: CourseDocumentTypeSummary[]
    optional: CourseDocumentTypeSummary[]
}

function isRequiredRequirement(requirement: CourseRequirementLike) {
    return (requirement.requirement_type ?? "REQUIRED") === "REQUIRED"
}

export function getMandatoryDocumentTypeIds(requirements: CourseRequirementLike[]): string[] {
    return requirements
        .filter(isRequiredRequirement)
        .map((requirement) => requirement.document_type?.id)
        .filter((id): id is string => Boolean(id))
}

export function getCourseDocumentTypeIds(requirements: CourseRequirementLike[]): string[] {
    return requirements
        .map((requirement) => requirement.document_type?.id)
        .filter((id): id is string => Boolean(id))
}

export function splitDocumentTypesByRequirement(
    requirements: CourseRequirementLike[]
): SplitCourseDocumentTypes {
    const required: CourseDocumentTypeSummary[] = []
    const optional: CourseDocumentTypeSummary[] = []

    for (const requirement of requirements) {
        const docType = requirement.document_type
        if (!docType?.id) continue

        const entry = { id: docType.id, name: docType.name ?? "Document" }
        const target = isRequiredRequirement(requirement) ? required : optional

        if (
            required.some((item) => item.id === docType.id) ||
            optional.some((item) => item.id === docType.id)
        ) {
            continue
        }

        target.push(entry)
    }

    return { required, optional }
}

export function mergeCourseDocumentRequirements(
    requirementsList: CourseRequirementLike[][]
): SplitCourseDocumentTypes {
    const byId = new Map<string, CourseDocumentTypeSummary & { isRequired: boolean }>()

    for (const requirements of requirementsList) {
        for (const requirement of requirements) {
            const docType = requirement.document_type
            if (!docType?.id) continue

            const existing = byId.get(docType.id)
            const isRequired = isRequiredRequirement(requirement)

            if (!existing) {
                byId.set(docType.id, {
                    id: docType.id,
                    name: docType.name ?? "Document",
                    isRequired,
                })
                continue
            }

            if (isRequired) {
                existing.isRequired = true
            }
        }
    }

    const required: CourseDocumentTypeSummary[] = []
    const optional: CourseDocumentTypeSummary[] = []

    for (const entry of byId.values()) {
        const { isRequired, ...docType } = entry
        if (isRequired) {
            required.push(docType)
        } else {
            optional.push(docType)
        }
    }

    return { required, optional }
}

export function resolveCourseDocumentTypes({
    requirements,
    fallbackDocumentTypes = [],
}: {
    requirements: CourseRequirementLike[]
    fallbackDocumentTypes?: CourseDocumentTypeSummary[]
}): SplitCourseDocumentTypes {
    const fromRequirements = splitDocumentTypesByRequirement(requirements)

    if (fromRequirements.required.length > 0 || fromRequirements.optional.length > 0) {
        return fromRequirements
    }

    return {
        required: [],
        optional: fallbackDocumentTypes,
    }
}

export function resolveCourseDocumentTypesForCourses(
    courses: Array<{ id: string; degree?: { requirements?: CourseRequirementLike[] } | null }>,
    selectedCourseIds: string[],
    fallbackDocumentTypes: CourseDocumentTypeSummary[] = []
): SplitCourseDocumentTypes {
    const requirementsList = selectedCourseIds
        .map((courseId) => courses.find((course) => course.id === courseId)?.degree?.requirements ?? [])
        .filter((requirements) => requirements.length > 0)

    if (requirementsList.length === 0) {
        return {
            required: [],
            optional: fallbackDocumentTypes,
        }
    }

    return mergeCourseDocumentRequirements(requirementsList)
}
