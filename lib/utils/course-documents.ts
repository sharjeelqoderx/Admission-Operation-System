import type { Database } from "@/types/supabase"

export type DocumentRequirementType = Database["public"]["Enums"]["document_requirement_type_enum"]

export type CourseDocumentTypeSummary = {
    id: string
    name: string
}

export type CourseRequirementLike = {
    requirement_type?: DocumentRequirementType | null
    is_deleted?: boolean | null
    document_type?: { id?: string; name?: string } | null
}

export type SplitCourseDocumentTypes = {
    required: CourseDocumentTypeSummary[]
    optional: CourseDocumentTypeSummary[]
}

function isActiveRequirement(requirement: CourseRequirementLike) {
    return requirement.is_deleted !== true
}

function isRequiredRequirement(requirement: CourseRequirementLike) {
    return (requirement.requirement_type ?? "REQUIRED") === "REQUIRED"
}

export function getMandatoryDocumentTypeIds(requirements: CourseRequirementLike[]): string[] {
    return requirements
        .filter(isActiveRequirement)
        .filter(isRequiredRequirement)
        .map((requirement) => requirement.document_type?.id)
        .filter((id): id is string => Boolean(id))
}

export function getCourseDocumentTypeIds(requirements: CourseRequirementLike[]): string[] {
    return requirements
        .filter(isActiveRequirement)
        .map((requirement) => requirement.document_type?.id)
        .filter((id): id is string => Boolean(id))
}

export function splitDocumentTypesByRequirement(
    requirements: CourseRequirementLike[]
): SplitCourseDocumentTypes {
    const required: CourseDocumentTypeSummary[] = []
    const optional: CourseDocumentTypeSummary[] = []

    for (const requirement of requirements) {
        if (!isActiveRequirement(requirement)) continue
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
            if (!isActiveRequirement(requirement)) continue
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

export function computeDocumentUploadStats(
    documentTypeIds: string[],
    hasUpload: (documentTypeId: string) => boolean
) {
    const total_required = documentTypeIds.length
    const uploaded_count = documentTypeIds.filter(hasUpload).length
    const completion_percentage =
        total_required === 0 ? 100 : Math.round((uploaded_count / total_required) * 100)

    return {
        total_required,
        uploaded_count,
        completion_percentage,
    }
}

export function buildUniqueRequiredDocuments<
    TRequirement extends CourseRequirementLike & {
        id?: string
        document_type?: {
            id?: string
            name?: string
            description?: string | null
            code?: string | null
        } | null
    },
    TUploaded,
>(params: {
    requirements: TRequirement[]
    getUploaded: (documentTypeId: string) => TUploaded | null | undefined
}) {
    const split = splitDocumentTypesByRequirement(params.requirements)

    return split.required.map(({ id, name }) => {
        const sourceRequirement = params.requirements.find(
            (requirement) => requirement.document_type?.id === id
        )
        const documentType = sourceRequirement?.document_type

        return {
            requirement_id: sourceRequirement?.id ?? id,
            document_type_id: id,
            requirement_type: "REQUIRED" as const,
            name: documentType?.name ?? name,
            description: documentType?.description ?? null,
            code: documentType?.code ?? null,
            uploaded: params.getUploaded(id) ?? null,
        }
    })
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
