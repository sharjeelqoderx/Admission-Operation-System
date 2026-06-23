"use client"

import type { ComponentType } from "react"
import { useCallback, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { UniversityAgentListResponse } from "@/types/schemas/university-agent"

export type UniversityAgentPageLogicProps = {
    overview: UniversityAgentListResponse
    statusValue: string
    activeTab: string
    isFetching: boolean
    onStatusChange: (value: string) => void
    onTabChange: (value: string) => void
    onPageChange: (page: number) => void
}

async function fetchUniversityAgents(params: { status?: string; page?: string }) {
    const url = new URL("/api/university/agents", window.location.origin)
    if (params.status && params.status !== "all") {
        url.searchParams.set("status", params.status)
    }
    if (params.page) url.searchParams.set("page", params.page)
    url.searchParams.set("limit", "10")

    const res = await fetch(url.toString())
    const json = await res.json()
    if (!res.ok) throw new Error(json?.error ?? "Failed to fetch university partners")
    return json.data as UniversityAgentListResponse
}

export function withUniversityAgentPageLogic(
    Component: ComponentType<UniversityAgentPageLogicProps>
) {
    return function UniversityAgentPageContainer({
        initialOverview,
    }: {
        initialOverview: UniversityAgentListResponse
    }) {
        const router = useRouter()
        const pathname = usePathname()
        const searchParams = useSearchParams()
        const status = searchParams.get("status") ?? "all"
        const page = searchParams.get("page") ?? "1"
        const [activeTab, setActiveTab] = useState("University Partners")

        const agentsQuery = useQuery({
            queryKey: ["university-agents", status, page],
            queryFn: () => fetchUniversityAgents({ status, page }),
            initialData: initialOverview,
        })

        const updateParams = useCallback(
            (updates: Record<string, string | null>) => {
                const params = new URLSearchParams(searchParams.toString())
                Object.entries(updates).forEach(([key, value]) => {
                    if (value && value !== "all") params.set(key, value)
                    else params.delete(key)
                })
                router.replace(`${pathname}?${params.toString()}`, { scroll: false })
            },
            [pathname, router, searchParams]
        )

        const overview = useMemo(
            () =>
                agentsQuery.data ?? {
                    stats: initialOverview.stats,
                    data: [],
                    pagination: initialOverview.pagination,
                },
            [agentsQuery.data, initialOverview.pagination, initialOverview.stats]
        )

        return (
            <Component
                overview={overview}
                statusValue={status}
                activeTab={activeTab}
                isFetching={agentsQuery.isFetching}
                onStatusChange={(value) => updateParams({ status: value, page: "1" })}
                onTabChange={setActiveTab}
                onPageChange={(nextPage) => updateParams({ page: String(nextPage) })}
            />
        )
    }
}
