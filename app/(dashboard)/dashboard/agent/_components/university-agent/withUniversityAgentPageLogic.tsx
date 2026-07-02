"use client"

import type { ComponentType } from "react"
import { useCallback, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { UniversityAgentListResponse } from "@/types/schemas/university-agent"

export type UniversityAgentPageLogicProps = {
    overview: UniversityAgentListResponse
    statusValue: string
    countryValue: string
    sortBy: string
    activeTab: string
    isFetching: boolean
    onStatusChange: (value: string) => void
    onCountryChange: (value: string) => void
    onSortByChange: (value: string) => void
    onTabChange: (value: string) => void
    onPageChange: (page: number) => void
    allCountries: string[]
}

async function fetchUniversityAgents(params: { 
    status?: string; 
    page?: string;
    country?: string;
    sortBy?: string;
}) {
    const url = new URL("/api/university/agents", window.location.origin)
    if (params.status && params.status !== "all") {
        url.searchParams.set("status", params.status)
    }
    if (params.country && params.country !== "all") {
        url.searchParams.set("country", params.country)
    }
    if (params.sortBy && params.sortBy !== "default") {
        url.searchParams.set("sortBy", params.sortBy)
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
        const country = searchParams.get("country") ?? "all"
        const sortBy = searchParams.get("sortBy") ?? "default"
        const page = searchParams.get("page") ?? "1"
        const [activeTab, setActiveTab] = useState("University Partners")

        const agentsQuery = useQuery({
            queryKey: ["university-agents", status, country, sortBy, page],
            queryFn: () => fetchUniversityAgents({ status, country, sortBy, page }),
            initialData: initialOverview,
        })

        const allCountries = useMemo(() => {
            const countries = new Set<string>()
            initialOverview.data.forEach(agent => {
                if (agent.country) countries.add(agent.country)
            })
            return Array.from(countries).sort()
        }, [initialOverview.data])

        const updateParams = useCallback(
            (updates: Record<string, string | null>) => {
                const params = new URLSearchParams(searchParams.toString())
                Object.entries(updates).forEach(([key, value]) => {
                    if (value && value !== "all" && value !== "default") params.set(key, value)
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
                countryValue={country}
                sortBy={sortBy}
                activeTab={activeTab}
                isFetching={agentsQuery.isFetching}
                onStatusChange={(value) => updateParams({ status: value, page: "1" })}
                onCountryChange={(value) => updateParams({ country: value, page: "1" })}
                onSortByChange={(value) => updateParams({ sortBy: value, page: "1" })}
                onTabChange={setActiveTab}
                onPageChange={(nextPage) => updateParams({ page: String(nextPage) })}
                allCountries={allCountries}
            />
        )
    }
}
