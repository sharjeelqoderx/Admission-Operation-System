"use client"

import type { ComponentType } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query"
import {
    applyUrlSearchParamUpdates,
    readUrlSearchParam,
} from "@/lib/navigation/replace-url-search-params"
import type {
    UniversityApplicationListResponse,
    UniversityApplicationTab,
} from "@/types/schemas/university-application"

export type UniversityApplicationInitialQuery = {
    q: string
    tab: UniversityApplicationTab
    page: string
}

export type UniversityApplicationPageLogicProps = {
    overview: UniversityApplicationListResponse
    searchValue: string
    activeTab: UniversityApplicationTab
    isFetching: boolean
    onSearchChange: (value: string) => void
    onTabChange: (value: UniversityApplicationTab) => void
    onTabHover: (value: UniversityApplicationTab) => void
    onPageChange: (page: number) => void
}

const UNIVERSITY_APPLICATION_TABS: UniversityApplicationTab[] = [
    "all",
    "pending-review",
    "awaiting-signature",
    "recently-completed",
    "rejected",
]

export async function fetchUniversityApplications(params: {
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

function readUniversityFiltersFromUrl() {
    return {
        q: readUrlSearchParam("q"),
        tab: (readUrlSearchParam("tab") || "all") as UniversityApplicationTab,
        page: readUrlSearchParam("page") || "1",
    }
}

export function withUniversityApplicationPageLogic(
    Component: ComponentType<UniversityApplicationPageLogicProps>
) {
    return function UniversityApplicationPageContainer({
        initialOverview,
        initialQuery,
    }: {
        initialOverview: UniversityApplicationListResponse
        initialQuery: UniversityApplicationInitialQuery
    }) {
        const queryClient = useQueryClient()
        const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

        const [filters, setFilters] = useState(initialQuery)
        const [searchInput, setSearchInput] = useState(initialQuery.q)

        const updateFilters = useCallback((updates: Partial<typeof initialQuery>) => {
            setFilters((current) => {
                const next = { ...current, ...updates }
                applyUrlSearchParamUpdates({
                    q: next.q || null,
                    tab: next.tab === "all" ? null : next.tab,
                    page: next.page === "1" ? null : next.page,
                })
                return next
            })
        }, [])

        useEffect(() => {
            const syncFiltersFromUrl = () => {
                const next = readUniversityFiltersFromUrl()
                setFilters(next)
                setSearchInput(next.q)
            }

            window.addEventListener("popstate", syncFiltersFromUrl)
            return () => window.removeEventListener("popstate", syncFiltersFromUrl)
        }, [])

        const prefetchTab = useCallback(
            (tab: UniversityApplicationTab, tabPage = "1") => {
                void queryClient.prefetchQuery({
                    queryKey: ["university-applications", filters.q, tab, tabPage],
                    queryFn: () =>
                        fetchUniversityApplications({ q: filters.q, tab, page: tabPage }),
                    staleTime: 60_000,
                })
            },
            [filters.q, queryClient]
        )

        useEffect(() => {
            UNIVERSITY_APPLICATION_TABS.forEach((tab) => {
                prefetchTab(tab)
            })
        }, [prefetchTab])

        const matchesInitialQuery =
            filters.q === initialQuery.q &&
            filters.page === initialQuery.page &&
            filters.tab === initialQuery.tab

        const applicationsQuery = useQuery({
            queryKey: ["university-applications", filters.q, filters.tab, filters.page],
            queryFn: () =>
                fetchUniversityApplications({
                    q: filters.q,
                    tab: filters.tab,
                    page: filters.page,
                }),
            initialData: initialOverview,
            placeholderData: keepPreviousData,
            staleTime: Infinity, // Cache indefinitely to avoid refetch on navigation
            gcTime: 300_000,
            refetchOnWindowFocus: false,
        })

        const overview = useMemo(
            () =>
                applicationsQuery.data ?? {
                    tab_counts: initialOverview.tab_counts,
                    data: [],
                    pagination: initialOverview.pagination,
                },
            [applicationsQuery.data, initialOverview.pagination, initialOverview.tab_counts]
        )

        const handleTabChange = useCallback(
            (value: UniversityApplicationTab) => {
                updateFilters({ tab: value, page: "1" })
                prefetchTab(value)
            },
            [prefetchTab, updateFilters]
        )

        const handleTabHover = useCallback(
            (value: UniversityApplicationTab) => {
                prefetchTab(value)
            },
            [prefetchTab]
        )

        const handleSearchChange = useCallback(
            (value: string) => {
                setSearchInput(value)

                if (searchTimeoutRef.current) {
                    clearTimeout(searchTimeoutRef.current)
                }

                searchTimeoutRef.current = setTimeout(() => {
                    updateFilters({ q: value.trim(), page: "1" })
                }, 400)
            },
            [updateFilters]
        )

        useEffect(() => {
            return () => {
                if (searchTimeoutRef.current) {
                    clearTimeout(searchTimeoutRef.current)
                }
            }
        }, [])

        return (
            <Component
                overview={overview}
                searchValue={searchInput}
                activeTab={filters.tab}
                isFetching={applicationsQuery.isFetching}
                onSearchChange={handleSearchChange}
                onTabChange={handleTabChange}
                onTabHover={handleTabHover}
                onPageChange={(nextPage) => updateFilters({ page: String(nextPage) })}
            />
        )
    }
}
