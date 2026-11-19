"use client"

import type { ComponentType } from "react"
import { useQuery } from "@tanstack/react-query"
import { ErrorView } from "@/components/shared/error-view"
import Loading from "../../loading"
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
    return function UniversityAgentDetailContainer({ profileId }: { profileId: string }) {
        const detailQuery = useQuery({
            queryKey: ["university-agent-detail", profileId],
            queryFn: () => fetchUniversityAgentDetail(profileId),
            retry: false,
        })

        if (detailQuery.isLoading) return <Loading />

        if (!detailQuery.data) {
            return (
                <div className="flex justify-center py-40">
                    <ErrorView
                        message={
                            detailQuery.error instanceof Error
                                ? detailQuery.error.message
                                : "University Partner not found"
                        }
                    />
                </div>
            )
        }

        return <Component detail={detailQuery.data} />
    }
}
