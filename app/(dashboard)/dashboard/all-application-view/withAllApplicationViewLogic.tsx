"use client"

import type { ComponentType } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type {
    ApplicationDashboardPageData,
    ApplicationListItem,
    ApplicationListPagination,
    ApplicationListResponse,
    ApplicationListStats,
    ApplicationProfileRole,
} from "@/types/schemas/application"

export type AllApplicationViewLogicProps = {
    role?: ApplicationProfileRole
    applications: ApplicationListItem[]
    pagination?: ApplicationListPagination
    stats: ApplicationListStats
    isLoading: boolean
    isFetching: boolean
    isError: boolean
    hasActiveFilters: boolean
    q: string
    status: string
    degreeId: string
    dateFrom: string
    dateTo: string
    handleSearch: (term: string) => void
    handlePageChange: (page: number) => void
    updateParams: (updates: Record<string, string>) => void
    handleResetFilters: () => void
    handleRetry: () => void
}

async function fetchAllApplicationsFromApi(params: {
    q: string
    status: string
    degreeId: string
    dateFrom: string
    dateTo: string
    page: number
    limit: number
}): Promise<ApplicationListResponse> {
    const url = new URL("/api/application", window.location.origin)
    url.searchParams.set("scope", "all")
    if (params.q) url.searchParams.set("q", params.q)
    if (params.status !== "all") url.searchParams.set("status", params.status)
    if (params.degreeId !== "all") url.searchParams.set("degree_id", params.degreeId)
    if (params.dateFrom) url.searchParams.set("date_from", params.dateFrom)
    if (params.dateTo) url.searchParams.set("date_to", params.dateTo)
    url.searchParams.set("page", String(params.page))
    url.searchParams.set("limit", String(params.limit))

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error("Failed to fetch applications")
    return res.json() as Promise<ApplicationListResponse>
}

export function withAllApplicationViewLogic(Component: ComponentType<AllApplicationViewLogicProps>) {
    return function AllApplicationViewContainer({
        initialData,
    }: {
        initialData: ApplicationDashboardPageData
    }) {
        const searchParams = useSearchParams()
        const router = useRouter()
        const pathname = usePathname()
        const timeoutRef = useRef<NodeJS.Timeout | null>(null)
        const pendingPageRef = useRef<number | null>(null)

        const q = searchParams.get("q") || ""
        const status = searchParams.get("status") || "all"
        const degreeId = searchParams.get("degree_id") || "all"
        const dateFrom = searchParams.get("date_from") || ""
        const dateTo = searchParams.get("date_to") || ""
        const urlPage = parseInt(searchParams.get("page") || "1", 10) || 1
        const limit = parseInt(searchParams.get("limit") || "10", 10) || 10
        const [page, setPage] = useState(urlPage)

        useEffect(() => {
            const syncedPage = parseInt(searchParams.get("page") || "1", 10) || 1
            if (pendingPageRef.current !== null) {
                if (syncedPage === pendingPageRef.current) {
                    pendingPageRef.current = null
                }
                return
            }
            setPage(syncedPage)
        }, [searchParams])

        const matchesInitialQuery =
            q === initialData.query.q &&
            status === initialData.query.status &&
            degreeId === initialData.query.degree_id &&
            dateFrom === initialData.query.date_from &&
            dateTo === initialData.query.date_to &&
            String(page) === initialData.query.page &&
            String(limit) === initialData.query.limit

        const replaceParams = useCallback(
            (mutator: (params: URLSearchParams) => void) => {
                const params = new URLSearchParams(searchParams.toString())
                mutator(params)
                const query = params.toString()
                router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
            },
            [pathname, router, searchParams]
        )

        const updateParams = useCallback(
            (updates: Record<string, string>) => {
                pendingPageRef.current = 1
                setPage(1)
                replaceParams((params) => {
                    Object.entries(updates).forEach(([key, value]) => {
                        if (value && value !== "all") {
                            params.set(key, value)
                        } else {
                            params.delete(key)
                        }
                    })
                    params.delete("page")
                })
            },
            [replaceParams]
        )

        const handleSearch = useCallback(
            (term: string) => {
                if (timeoutRef.current) clearTimeout(timeoutRef.current)
                timeoutRef.current = setTimeout(() => {
                    pendingPageRef.current = 1
                    setPage(1)
                    replaceParams((params) => {
                        if (term) params.set("q", term)
                        else params.delete("q")
                        params.delete("page")
                    })
                }, 300) // Reduced from 400ms to 300ms for faster response
            },
            [replaceParams]
        )

        const applicationsQuery = useQuery({
            queryKey: ["applications", "all", q, status, degreeId, dateFrom, dateTo, page, limit],
            queryFn: () =>
                fetchAllApplicationsFromApi({
                    q,
                    status,
                    degreeId,
                    dateFrom,
                    dateTo,
                    page,
                    limit,
                }),
            initialData: matchesInitialQuery ? initialData.applications : undefined,
            placeholderData: keepPreviousData,
            staleTime: 5 * 60 * 1000, // Cache for 5 minutes for smoother navigation
            retry: false,
        })

        const handlePageChange = useCallback(
            (newPage: number) => {
                if (newPage === page) return
                if (newPage < 1) return

                pendingPageRef.current = newPage
                setPage(newPage)
                replaceParams((params) => {
                    if (newPage > 1) params.set("page", String(newPage))
                    else params.delete("page")
                })
            },
            [page, replaceParams]
        )

        const handleResetFilters = useCallback(() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            pendingPageRef.current = 1
            setPage(1)
            router.replace(pathname, { scroll: false })
        }, [pathname, router])

        const hasActiveFilters = useMemo(
            () =>
                Boolean(q) ||
                status !== "all" ||
                degreeId !== "all" ||
                Boolean(dateFrom) ||
                Boolean(dateTo),
            [q, status, degreeId, dateFrom, dateTo]
        )

        const queryPagination = applicationsQuery.data?.pagination
        const filteredTotal =
            queryPagination?.total ??
            applicationsQuery.data?.stats?.total ??
            applicationsQuery.data?.data?.length ??
            0
        const pagination = {
            total: filteredTotal,
            page,
            limit,
            totalPages:
                queryPagination?.totalPages ??
                (filteredTotal === 0 ? 0 : Math.max(1, Math.ceil(filteredTotal / limit))),
        }

        const stats = applicationsQuery.data?.stats ??
            initialData.applications.stats ?? {
                total: 0,
                pending: 0,
                accepted: 0,
            }

        return (
            <Component
                role={applicationsQuery.data?.role ?? initialData.applications.role}
                applications={applicationsQuery.data?.data ?? []}
                pagination={pagination}
                stats={stats}
                isLoading={applicationsQuery.isLoading && !applicationsQuery.data}
                isFetching={applicationsQuery.isFetching}
                isError={applicationsQuery.isError}
                hasActiveFilters={hasActiveFilters}
                q={q}
                status={status}
                degreeId={degreeId}
                dateFrom={dateFrom}
                dateTo={dateTo}
                handleSearch={handleSearch}
                handlePageChange={handlePageChange}
                updateParams={updateParams}
                handleResetFilters={handleResetFilters}
                handleRetry={() => {
                    void applicationsQuery.refetch()
                }}
            />
        )
    }
}
