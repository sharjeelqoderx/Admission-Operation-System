import {
    getHighestEducationLabel,
    getTargetCourseLevelsForHighestEducation,
    isHighestEducationLevel,
    normalizeHighestEducationFromStored,
    type HighestEducationLevel,
} from "@/types/schemas/highest-education"
import { getTargetCourseLevelNames } from "@/lib/utils/levels"
import type { QueryClient } from "@tanstack/react-query"
import { COURSE_DOCUMENT_BUNDLES_QUERY_KEY } from "@/hooks/useCourseDocumentBundles"

export type QualificationSnapshot = {
    qualification?: string | null
    levelName?: string | null
    degreeName?: string | null
}

export function getQualificationSnapshotFromEducation(
    education?: {
        qualification?: string | null
        qualification_degree?: {
            name?: string | null
            level?: { name?: string | null } | null
        } | null
    } | null
): QualificationSnapshot {
    if (!education) {
        return {}
    }

    return {
        qualification: education.qualification,
        levelName: education.qualification_degree?.level?.name ?? null,
        degreeName: education.qualification_degree?.name ?? null,
    }
}

export function resolveQualificationTier(
    snapshot: QualificationSnapshot
): HighestEducationLevel | "" {
    return normalizeHighestEducationFromStored(
        snapshot.qualification,
        snapshot.levelName
    )
}

function getTargetLevelKey(snapshot: QualificationSnapshot): string {
    const tier = resolveQualificationTier(snapshot)

    if (isHighestEducationLevel(tier)) {
        return getTargetCourseLevelsForHighestEducation(tier).slice().sort().join("|")
    }

    if (snapshot.levelName?.trim()) {
        return getTargetCourseLevelNames(snapshot.levelName).slice().sort().join("|")
    }

    return ""
}

export function hasStudentQualification(snapshot: QualificationSnapshot): boolean {
    return Boolean(
        resolveQualificationTier(snapshot) ||
            snapshot.levelName?.trim() ||
            snapshot.degreeName?.trim() ||
            snapshot.qualification?.trim()
    )
}

/** True when eligible programs / required documents would change (e.g. bachelor → master). */
export function hasQualificationDocumentImpact(
    previous: QualificationSnapshot,
    next: QualificationSnapshot
): boolean {
    const previousKey = getTargetLevelKey(previous)
    const nextKey = getTargetLevelKey(next)

    if (!previousKey || !nextKey) {
        return false
    }

    return previousKey !== nextKey
}

export function isQualificationUpgrade(
    previous: QualificationSnapshot,
    next: QualificationSnapshot
): boolean {
    const previousTier = resolveQualificationTier(previous)
    const nextTier = resolveQualificationTier(next)

    if (!previousTier || !nextTier || previousTier === nextTier) {
        return hasQualificationDocumentImpact(previous, next)
    }

    const tierPriority: Record<HighestEducationLevel, number> = {
        higher_secondary: 1,
        bachelor_ongoing: 2,
        bachelor_completed: 3,
        master: 4,
    }

    return (
        tierPriority[nextTier] > tierPriority[previousTier] ||
        hasQualificationDocumentImpact(previous, next)
    )
}

export function getQualificationUpgradeMessage(
    previous: QualificationSnapshot,
    next: QualificationSnapshot
): { title: string; description: string } {
    const previousLabel =
        getHighestEducationLabel(resolveQualificationTier(previous)) ||
        previous.levelName ||
        previous.degreeName ||
        "your previous qualification"
    const nextLabel =
        getHighestEducationLabel(resolveQualificationTier(next)) ||
        next.levelName ||
        next.degreeName ||
        "your updated qualification"

    return {
        title: "Highest qualification updated",
        description: `The highest qualification changed from ${previousLabel} to ${nextLabel}. Available programs and required documents have been refreshed. Please review the updated document requirements and upload any newly required documents.`,
    }
}

export function invalidateQualificationDocumentQueries(
    queryClient: QueryClient,
    profileId?: string
) {
    queryClient.invalidateQueries({ queryKey: COURSE_DOCUMENT_BUNDLES_QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: ["student-documents"] })
    queryClient.invalidateQueries({ queryKey: ["onboarding-documents"] })
    queryClient.invalidateQueries({ queryKey: ["documents"] })

    if (profileId) {
        queryClient.invalidateQueries({
            queryKey: [...COURSE_DOCUMENT_BUNDLES_QUERY_KEY, profileId],
        })
        queryClient.invalidateQueries({
            queryKey: ["student-documents", profileId],
            exact: false,
        })
        queryClient.invalidateQueries({
            queryKey: ["onboarding-documents", profileId],
        })
    }
}
