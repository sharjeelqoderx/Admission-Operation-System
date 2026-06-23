import "server-only"

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUuid(value?: string | null) {
    return Boolean(value && UUID_REGEX.test(value))
}

export async function resolveQualificationLabel(
    supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createSupabaseServerClient>>,
    params: { qualification?: string | null; degree_id?: string | null }
): Promise<string | null> {
    const lookupIds = [params.degree_id, params.qualification].filter(
        (id): id is string => Boolean(id && isUuid(id))
    )

    if (lookupIds.length > 0) {
        const { data: educationTypes } = await supabase
            .from("education_type")
            .select("id, name")
            .in("id", lookupIds)

        for (const id of lookupIds) {
            const match = (educationTypes ?? []).find((row) => row.id === id)
            if (match?.name) return match.name
        }

        const unresolved = lookupIds.filter(
            (id) => !(educationTypes ?? []).some((row) => row.id === id)
        )

        if (unresolved.length > 0) {
            const { data: degrees } = await supabase
                .from("degree")
                .select("id, name")
                .in("id", unresolved)

            for (const id of unresolved) {
                const match = (degrees ?? []).find((row) => row.id === id)
                if (match?.name) return match.name
            }
        }
    }

    if (params.qualification && !isUuid(params.qualification)) {
        return params.qualification
    }

    return null
}
