import { useQuery } from "@tanstack/react-query"
import type { Tables } from "@/types/supabase"

export const LEVELS_QUERY_KEYS = {
    all: ["levels"] as const,
}

export type LevelOption = Pick<
    Tables<"levels">,
    "id" | "name" | "university_id" | "created_at" | "updated_at"
>

async function fetchLevelsClient(): Promise<LevelOption[]> {
    const res = await fetch("/api/levels")
    const json = await res.json()
    if (!res.ok) {
        throw new Error(json.error ?? "Failed to load levels")
    }
    return json.data as LevelOption[]
}

export function useLevels() {
    return useQuery({
        queryKey: LEVELS_QUERY_KEYS.all,
        queryFn: fetchLevelsClient,
        staleTime: 1000 * 60 * 60,
        retry: 2,
    })
}
