"use client"

import type { ComponentType } from "react"
import { useQuery } from "@tanstack/react-query"
import type { UniversityOverview } from "@/types/schemas/university-overview"
import { normalizeUniversityOverview } from "@/types/schemas/university-overview"

export type UniversityOverviewLogicProps = {
    overview: UniversityOverview
}

async function fetchUniversityOverview(): Promise<UniversityOverview> {
    const res = await fetch("/api/university/overview")
    const json = await res.json()
    if (!res.ok) {
        throw new Error(json?.error ?? "Failed to fetch university overview")
    }
    return json.data as UniversityOverview
}

function selectOverview(overview: UniversityOverview | undefined): UniversityOverview {
    if (!overview) {
        throw new Error("University overview data is unavailable")
    }

    return normalizeUniversityOverview(overview)
}

export function withUniversityOverviewLogic(
    Component: ComponentType<UniversityOverviewLogicProps>
) {
    return function UniversityOverviewContainer({
        initialOverview,
    }: {
        initialOverview: UniversityOverview
    }) {
        const overviewQuery = useQuery({
            queryKey: ["university-overview", "v2"],
            queryFn: async () => selectOverview(await fetchUniversityOverview()),
            initialData: selectOverview(initialOverview),
        })

        return <Component overview={overviewQuery.data} />
    }
}
