
export const LEVEL_PRIORITY: Record<string, number> = {
  "matriculation": 1,
  "o levels": 1,
  "high school": 1,
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
  "phd": 8,
  "doctorate": 8,
};

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

export function getNextPossibleLevelPriorities(
  highestLevelName?: string | null
): number[] {
  const highestPriority = getLevelPriority(highestLevelName);
  const allPriorities = Array.from(new Set(Object.values(LEVEL_PRIORITY)));
  return allPriorities.filter((p) => p > highestPriority).sort((a, b) => a - b);
}
