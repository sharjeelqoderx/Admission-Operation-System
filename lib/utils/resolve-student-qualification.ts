import {
    filterCoursesByHighestEducation,
    getTargetCourseLevelsForHighestEducation,
    isHighestEducationLevel,
} from "@/types/schemas/highest-education"
import {
    filterCoursesByQualificationLevel,
    getTargetCourseLevelNames,
    matchesTargetCourseLevel,
} from "@/lib/utils/levels"
import type { CourseProgram } from "@/types/schemas/program"
import type { DegreeDocumentBundle } from "@/types/schemas/document"
import {
    getQualificationSnapshotFromEducation,
    hasStudentQualification,
    resolveQualificationTier,
    type QualificationSnapshot,
} from "@/lib/utils/qualification-upgrade"

export type { QualificationSnapshot }
export { getQualificationSnapshotFromEducation, hasStudentQualification, resolveQualificationTier }

export function filterCoursesForStudentQualification<T extends CourseProgram>(
    courses: T[],
    snapshot: QualificationSnapshot
): T[] {
    const tier = resolveQualificationTier(snapshot)

    if (isHighestEducationLevel(tier)) {
        return filterCoursesByHighestEducation(courses, tier)
    }

    if (snapshot.levelName || snapshot.degreeName) {
        return filterCoursesByQualificationLevel(
            courses,
            snapshot.levelName,
            snapshot.degreeName
        )
    }

    return []
}

function getTargetLevelsForSnapshot(snapshot: QualificationSnapshot): string[] {
    const tier = resolveQualificationTier(snapshot)

    if (isHighestEducationLevel(tier)) {
        return getTargetCourseLevelsForHighestEducation(tier)
    }

    if (snapshot.levelName?.trim()) {
        return getTargetCourseLevelNames(snapshot.levelName)
    }

    return []
}

export function filterDegreeBundlesByQualification(
    bundles: DegreeDocumentBundle[],
    snapshot: QualificationSnapshot
): DegreeDocumentBundle[] {
    if (!hasStudentQualification(snapshot)) {
        return bundles
    }

    const targetLevels = getTargetLevelsForSnapshot(snapshot)
    if (targetLevels.length === 0) {
        return []
    }

    return bundles.filter((bundle) =>
        matchesTargetCourseLevel(bundle.degree.level?.name, targetLevels)
    )
}
