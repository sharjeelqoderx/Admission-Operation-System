"use client"

import { memo } from "react"
import type { ComponentType } from "react"
import { useQuery } from "@tanstack/react-query"
import type { UniversityAgentDetail } from "@/types/schemas/university-agent"

export type UniversityAgentDetailLogicProps = {
    detail: UniversityAgentDetail
}

async function fetchUniversityAgentDetail(profileId: string) {
    const res = await fetch(`/api/university/agents/${profileId}`)
    const json = await res.json()
    if (!res.ok) throw new Error(json?.error ?? "Failed to fetch university partner detail")
    return json.data as UniversityAgentDetail
}

export function withUniversityAgentDetailLogic(
    Component: ComponentType<UniversityAgentDetailLogicProps>
) {
    return function UniversityAgentDetailContainer({
        profileId,
        initialDetail,
    }: {
        profileId: string
        initialDetail: UniversityAgentDetail
    }) {
        const detailQuery = useQuery({
            queryKey: ["university-agent-detail", profileId],
            queryFn: () => fetchUniversityAgentDetail(profileId),
            initialData: initialDetail,
        })

        return <Component detail={detailQuery.data} />
    }
}
