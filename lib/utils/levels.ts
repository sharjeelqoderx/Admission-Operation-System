
export const LEVEL_PRIORITY: Record<string, number> = {
  "matriculation": 1,
  "o levels": 1,
  "high school": 1,
  "matric": 1,
  "intermediate": 2,
  "a levels": 2,
  "foundation": 3,
  "diploma": 4,
  "associate": 5,
  "associate degree": 5,
  "bachelor": 6,
  "bachelors": 6,
  "bsc": 6,
  "ba": 6,
  "bba": 6,
  "btech": 6,
  "bcom": 6,
  "master": 7,
  "masters": 7,
  "mba": 7,
  "msc": 7,
  "ma": 7,
  "mphil": 7,
  "phd": 8,
  "doctorate": 8,
};

export function filterCoursesAboveQualification<
  T extends { degree?: { level?: { name?: string | null } | null } | null },
>(
  courses: T[],
  qualificationLevelName?: string | null
): T[] {
  const highestPriority = getLevelPriority(qualificationLevelName);
  if (highestPriority <= 0) return courses;

  return courses.filter((course) => {
    const courseLevelPriority = getLevelPriority(course.degree?.level?.name);
    return courseLevelPriority > highestPriority;
  });
}

export function getLevelPriority(levelName?: string | null): number {
  if (!levelName) return 0;
  const lowerName = levelName.toLowerCase();
  for (const [key, priority] of Object.entries(LEVEL_PRIORITY)) {
    if (lowerName.includes(key)) {
      return priority;
    }
  }
  return 0;
}

function normalizeLevelName(levelName?: string | null): string {
  return levelName?.trim().toLowerCase() ?? ""
}

/** When true, every course is eligible (e.g. Studienkolleg / Foundation). */
export function shouldShowAllCoursesForQualification(
  qualificationLevelName?: string | null,
  qualificationDegreeName?: string | null
): boolean {
  const level = normalizeLevelName(qualificationLevelName)
  const degreeName = normalizeLevelName(qualificationDegreeName)

  if (level === "foundation" || level.includes("studienkolleg")) return true
  if (degreeName.includes("studienkolleg")) return true

  // Degree selected but no mapped academic level — show full catalog
  if (!qualificationLevelName?.trim() && qualificationDegreeName?.trim()) return true

  return false
}

/** Maps highest qualification level to eligible course level(s). */
export function getTargetCourseLevelNames(
  qualificationLevelName?: string | null
): string[] {
  const level = normalizeLevelName(qualificationLevelName)
  if (!level) return []

  if (level === "mba") return ["MBA"]
  if (level === "bachelor") return ["Master"]
  if (level === "master") return ["Master", "MBA"]

  const priority = getLevelPriority(qualificationLevelName)
  if (priority === 6) return ["Master"]

  return []
}

export function matchesTargetCourseLevel(
  courseLevelName?: string | null,
  targetLevelNames: string[] = []
): boolean {
  const courseLevel = normalizeLevelName(courseLevelName)
  if (!courseLevel || targetLevelNames.length === 0) return false

  return targetLevelNames.some(
    (target) => courseLevel === normalizeLevelName(target)
  )
}

export function filterCoursesByQualificationLevel<
  T extends { degree?: { level?: { name?: string | null } | null } | null },
>(
  courses: T[],
  qualificationLevelName?: string | null,
  qualificationDegreeName?: string | null
): T[] {
  if (
    shouldShowAllCoursesForQualification(
      qualificationLevelName,
      qualificationDegreeName
    )
  ) {
    return courses
  }

  const targetLevelNames = getTargetCourseLevelNames(qualificationLevelName)
  if (targetLevelNames.length === 0) return []

  return courses.filter((course) =>
    matchesTargetCourseLevel(course.degree?.level?.name, targetLevelNames)
  )
}

export function getNextPossibleLevelPriorities(
  highestLevelName?: string | null
): number[] {
  const highestPriority = getLevelPriority(highestLevelName);
  const allPriorities = Array.from(new Set(Object.values(LEVEL_PRIORITY)));
  return allPriorities.filter((p) => p > highestPriority).sort((a, b) => a - b);
}

/** Returns Tailwind classes for a level badge pill based on the level name. */
export function getLevelBadgeStyle(levelName?: string | null): string {
  if (!levelName) return "bg-gray-100 text-gray-500"
  const lower = levelName.toLowerCase()

  if (lower.includes("phd") || lower.includes("doctorate"))
    return "bg-purple-100 text-purple-700"
  if (lower.includes("mba"))
    return "bg-rose-100 text-rose-700"
  if (lower.includes("master") || lower.includes("msc") || lower.includes("mphil"))
    return "bg-blue-100 text-blue-700"
  if (lower.includes("bachelor") || lower.includes("bsc") || lower.includes("ba") || lower.includes("bba") || lower.includes("btech") || lower.includes("bcom"))
    return "bg-emerald-100 text-emerald-700"
  if (lower.includes("foundation") || lower.includes("studienkolleg"))
    return "bg-amber-100 text-amber-700"
  if (lower.includes("intermediate") || lower.includes("a level"))
    return "bg-orange-100 text-orange-700"
  if (lower.includes("diploma"))
    return "bg-teal-100 text-teal-700"
  if (lower.includes("associate"))
    return "bg-cyan-100 text-cyan-700"
  if (lower.includes("matric") || lower.includes("high school") || lower.includes("o level"))
    return "bg-gray-100 text-gray-600"

  return "bg-indigo-100 text-indigo-700"
}
