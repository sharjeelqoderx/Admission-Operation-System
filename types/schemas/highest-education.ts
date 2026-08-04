import { z } from "zod"
import { matchesTargetCourseLevel } from "@/lib/utils/levels"

export const HighestEducationLevelSchema = z.enum([
    "higher_secondary",
    "bachelor_ongoing",
    "bachelor_completed",
    "master",
])

export type HighestEducationLevel = z.infer<typeof HighestEducationLevelSchema>

export const HIGHEST_EDUCATION_OPTIONS: ReadonlyArray<{
    value: HighestEducationLevel
    label: string
}> = [
    {
        value: "higher_secondary",
        label: "Higher Secondary (12th) / Diploma",
    },
    {
        value: "bachelor_ongoing",
        label: "Bachelor - Ongoing / Adv. Diploma",
    },
    {
        value: "bachelor_completed",
        label: "Bachelor - Completed / Adv. Diploma",
    },
    {
        value: "master",
        label: "Master",
    },
] as const

export function isHighestEducationLevel(value: string): value is HighestEducationLevel {
    return HighestEducationLevelSchema.safeParse(value).success
}

export function getHighestEducationLabel(value: string | null | undefined): string {
    if (!value) return ""
    const option = HIGHEST_EDUCATION_OPTIONS.find((entry) => entry.value === value)
    return option?.label ?? value
}

/** Map legacy degree UUID / level names to the fixed highest-education keys when possible. */
export function normalizeHighestEducationFromStored(
    qualification: string | null | undefined,
    levelName?: string | null
): HighestEducationLevel | "" {
    if (qualification && isHighestEducationLevel(qualification)) {
        return qualification
    }

    const normalizedLevel = levelName?.trim().toLowerCase() ?? ""

    if (normalizedLevel.includes("foundation") || normalizedLevel.includes("diploma")) {
        return "higher_secondary"
    }

    if (normalizedLevel.includes("bachelor")) {
        return "bachelor_completed"
    }

    if (normalizedLevel.includes("master") || normalizedLevel === "mba") {
        return "master"
    }

    return ""
}

export function getTargetCourseLevelsForHighestEducation(
    educationLevel: HighestEducationLevel
): string[] {
    switch (educationLevel) {
        case "higher_secondary":
            return ["Bachelor", "Foundation"]
        case "bachelor_ongoing":
        case "bachelor_completed":
            return ["Master"]
        case "master":
            return ["Master", "MBA"]
        default:
            return []
    }
}

export function filterCoursesByHighestEducation<
    T extends { degree?: { level?: { name?: string | null } | null } | null },
>(courses: T[], educationLevel?: string | null): T[] {
    if (!educationLevel || !isHighestEducationLevel(educationLevel)) {
        return []
    }

    const targetLevelNames = getTargetCourseLevelsForHighestEducation(educationLevel)

    return courses.filter((course) =>
        matchesTargetCourseLevel(course.degree?.level?.name, targetLevelNames)
    )
}
