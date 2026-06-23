import { getLevelPriority } from "@/lib/utils/levels"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

export type ResolvedQualification = {
    id: string
    name: string
    level?: { id: string; name: string } | null
}

export async function resolveQualificationsById(
    supabase: SupabaseClient<Database>,
    qualificationIds: string[]
): Promise<Map<string, ResolvedQualification>> {
    const qualificationById = new Map<string, ResolvedQualification>()

    if (qualificationIds.length === 0) {
        return qualificationById
    }

    const { data: educationTypes } = await supabase
        .from("education_type")
        .select("id, name, level")
        .in("id", qualificationIds)

    for (const row of educationTypes ?? []) {
        qualificationById.set(row.id, {
            id: row.id,
            name: row.name,
            level: { id: row.id, name: row.name },
        })
    }

    const unresolvedIds = qualificationIds.filter((id) => !qualificationById.has(id))
    if (unresolvedIds.length > 0) {
        const { data: qualificationDegrees } = await supabase
            .from("degree")
            .select("id, name, level_id")
            .in("id", unresolvedIds)

        const levelIds = (qualificationDegrees ?? [])
            .map((degree) => degree.level_id)
            .filter((id): id is string => Boolean(id))

        let levelById = new Map<string, { id: string; name: string }>()
        if (levelIds.length > 0) {
            const { data: levels } = await supabase
                .from("levels")
                .select("id, name")
                .in("id", levelIds)
            levelById = new Map((levels ?? []).map((level) => [level.id, level]))
        }

        for (const degree of qualificationDegrees ?? []) {
            qualificationById.set(degree.id, {
                id: degree.id,
                name: degree.name,
                level: degree.level_id ? levelById.get(degree.level_id) ?? null : null,
            })
        }
    }

    return qualificationById
}

export function resolveHighestQualificationName(
    educationRows: Array<{ qualification: string | null }>,
    qualificationById: Map<string, ResolvedQualification>
): string | null {
    let highestPriority = -1
    let highestName: string | null = null

    for (const row of educationRows) {
        if (!row.qualification) continue

        const qualification = qualificationById.get(row.qualification)
        if (!qualification) continue

        const priority = getLevelPriority(qualification.level?.name ?? qualification.name)
        if (priority > highestPriority) {
            highestPriority = priority
            highestName = qualification.name
        }
    }

    return highestName
}
