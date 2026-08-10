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

function matchesHigherSecondaryLevel(normalized: string): boolean {
    return (
        normalized.includes("matric") ||
        normalized.includes("intermediate") ||
        normalized.includes("high school") ||
        normalized.includes("o level") ||
        normalized.includes("a level") ||
        normalized.includes("higher secondary") ||
        normalized.includes("12th") ||
        normalized.includes("associate")
    )
}

function matchesMasterLevel(normalized: string): boolean {
    return (
        normalized.includes("master") ||
        normalized.includes("mba") ||
        normalized.includes("mphil") ||
        normalized.includes("phd") ||
        normalized.includes("doctorate")
    )
}

/** Map legacy degree UUID / level names to the fixed highest-education keys when possible. */
export function normalizeHighestEducationFromStored(
    qualification: string | null | undefined,
    levelName?: string | null,
    degreeName?: string | null
): HighestEducationLevel | "" {
    if (qualification && isHighestEducationLevel(qualification)) {
        return qualification
    }

    const candidates = [levelName, degreeName]
        .filter((value): value is string => Boolean(value?.trim()))
        .map((value) => value.trim().toLowerCase())

    for (const normalized of candidates) {
        if (normalized.includes("foundation") || normalized.includes("diploma")) {
            return "higher_secondary"
        }

        if (matchesHigherSecondaryLevel(normalized)) {
            return "higher_secondary"
        }

        if (normalized.includes("bachelor") && normalized.includes("ongoing")) {
            return "bachelor_ongoing"
        }

        if (normalized.includes("bachelor")) {
            return "bachelor_completed"
        }

        if (matchesMasterLevel(normalized)) {
            return "master"
        }
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
