"use client"

import type { ComponentType } from "react"
import { useQuery } from "@tanstack/react-query"
import Loading from "../../loading"
import { ErrorView } from "@/components/shared/error-view"
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

export function withUniversityOverviewLogic(
    Component: ComponentType<UniversityOverviewLogicProps>
) {
    return function UniversityOverviewContainer() {
        const overviewQuery = useQuery({
            queryKey: ["university-overview", "v3"],
            queryFn: async () => normalizeUniversityOverview(await fetchUniversityOverview()),
            staleTime: 5 * 60 * 1000,
        })

        if (overviewQuery.isError) {
            return <ErrorView message={overviewQuery.error.message} />
        }

        if (!overviewQuery.data) {
            return <Loading />
        }

        return <Component overview={overviewQuery.data} />
    }
}
