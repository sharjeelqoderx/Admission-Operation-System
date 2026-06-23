"use client"

import type { ComponentType } from "react"
import { useCallback, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type {
    UniversityApplicationListResponse,
    UniversityApplicationTab,
} from "@/types/schemas/university-application"

export type UniversityApplicationPageLogicProps = {
    overview: UniversityApplicationListResponse
    searchValue: string
    activeTab: UniversityApplicationTab
    isFetching: boolean
    onSearchChange: (value: string) => void
    onTabChange: (value: UniversityApplicationTab) => void
    onPageChange: (page: number) => void
}

async function fetchUniversityApplications(params: {
    q?: string
    tab?: string
    page?: string
}) {
    const url = new URL("/api/university/applications", window.location.origin)
    if (params.q) url.searchParams.set("q", params.q)
    if (params.tab && params.tab !== "all") {
        url.searchParams.set("tab", params.tab)
    }
    if (params.page) url.searchParams.set("page", params.page)
    url.searchParams.set("limit", "10")

    const res = await fetch(url.toString())
    const json = await res.json()
    if (!res.ok) {
        throw new Error(json?.error ?? "Failed to fetch applications")
    }
    return json.data as UniversityApplicationListResponse
}

export function withUniversityApplicationPageLogic(
    Component: ComponentType<UniversityApplicationPageLogicProps>
) {
    return function UniversityApplicationPageContainer({
        initialOverview,
    }: {
        initialOverview: UniversityApplicationListResponse
    }) {
        const router = useRouter()
        const pathname = usePathname()
        const searchParams = useSearchParams()

        const q = searchParams.get("q") ?? ""
        const tab = (searchParams.get("tab") ?? "all") as UniversityApplicationTab
        const page = searchParams.get("page") ?? "1"

        const applicationsQuery = useQuery({
            queryKey: ["university-applications", q, tab, page],
            queryFn: () => fetchUniversityApplications({ q, tab, page }),
            initialData: initialOverview,
        })

        const updateParams = useCallback(
            (updates: Record<string, string | null>) => {
                const params = new URLSearchParams(searchParams.toString())
                Object.entries(updates).forEach(([key, value]) => {
                    if (value && value !== "all") {
                        params.set(key, value)
                    } else {
                        params.delete(key)
                    }
                })
                router.replace(`${pathname}?${params.toString()}`, { scroll: false })
            },
            [pathname, router, searchParams]
        )

        const overview = useMemo(
            () =>
                applicationsQuery.data ?? {
                    tab_counts: initialOverview.tab_counts,
                    data: [],
                    pagination: initialOverview.pagination,
                },
            [applicationsQuery.data, initialOverview.pagination, initialOverview.tab_counts]
        )

        return (
            <Component
                overview={overview}
                searchValue={q}
                activeTab={tab}
                isFetching={applicationsQuery.isFetching}
                onSearchChange={(value) => updateParams({ q: value || null, page: "1" })}
                onTabChange={(value) => updateParams({ tab: value, page: "1" })}
                onPageChange={(nextPage) => updateParams({ page: String(nextPage) })}
            />
        )
    }
}
