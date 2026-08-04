import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import { Role } from "@/types/enums/role"
import { isUniversityRole } from "@/lib/auth/university-role"

export type UniversityApplicationScope = {
    universityIds: string[] | null
}

export async function resolveUniversityApplicationScope(
    supabase: SupabaseClient<Database>,
    userId: string,
    role: string | null | undefined
): Promise<UniversityApplicationScope> {
    if (role === Role.SUPER_ADMIN) {
        return { universityIds: null }
    }

    if (role === Role.ADMIN) {
        return { universityIds: [userId] }
    }

    if (role === Role.MANAGEMENT) {
        const [{ data: adminProfiles }, { data: levels }] = await Promise.all([
            supabase.from("profile").select("id").eq("role", Role.ADMIN),
            supabase.from("levels").select("university_id").not("university_id", "is", null),
        ])

        const ids = new Set<string>()

        for (const profile of adminProfiles ?? []) {
            ids.add(profile.id)
        }

        for (const level of levels ?? []) {
            if (level.university_id) {
                ids.add(level.university_id)
            }
        }

        if (ids.size === 0) {
            ids.add(userId)
        }

        return { universityIds: Array.from(ids) }
    }

    if (isUniversityRole(role)) {
        return { universityIds: [userId] }
    }

    return { universityIds: [userId] }
}

export function isUniversityIdInScope(
    universityId: string,
    scope: UniversityApplicationScope
): boolean {
    if (scope.universityIds === null) {
        return true
    }

    return scope.universityIds.includes(universityId)
}

export function applyUniversityIdFilter<TQuery extends { eq: Function; in: Function }>(
    query: TQuery,
    column: string,
    scope: UniversityApplicationScope
): TQuery {
    if (scope.universityIds === null) {
        return query
    }

    if (scope.universityIds.length === 1) {
        return query.eq(column, scope.universityIds[0]) as TQuery
    }

    return query.in(column, scope.universityIds) as TQuery
}
