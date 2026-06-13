import { useQuery } from "@tanstack/react-query"
import type { Tables } from "@/types/supabase"

export const DEGREES_QUERY_KEYS = {
    all: ["degrees"] as const,
}

export type DegreeOption = Pick<
    Tables<"degree">,
    "id" | "name" | "credits" | "location" | "language_of_study" | "duration" | "level_id"
> & {
    level: Pick<Tables<"levels">, "id" | "name"> | null
}

async function fetchDegreesClient(): Promise<DegreeOption[]> {
    const res = await fetch("/api/degree")
    const json = await res.json()
    if (!res.ok) {
        throw new Error(json.error ?? "Failed to load degrees")
    }
    return json.data as DegreeOption[]
}

export function useDegrees() {
    return useQuery({
        queryKey: DEGREES_QUERY_KEYS.all,
        queryFn: fetchDegreesClient,
        staleTime: 1000 * 60 * 60,
        retry: 2,
    })
}

export function formatDegreeLabel(degree: DegreeOption): string {
    const parts = [
        degree.name,
        degree.location,
        degree.credits != null ? `${degree.credits} ECTS` : null,
        degree.duration,
    ].filter(Boolean)

    return parts.join(" • ")
}
