"use client"

import type { ComponentType } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import {
    applyUrlSearchParamUpdates,
    readUrlSearchParam,
} from "@/lib/navigation/replace-url-search-params"
import type {
    OfferDashboardPageData,
    OfferListItem,
    OfferListPagination,
    OfferListResponse,
} from "@/types/schemas/offer"

export type OfferPageLogicProps = {
    offers: OfferListItem[]
    pagination?: OfferListPagination
    isLoading: boolean
    isFetching: boolean
    isError: boolean
    q: string
    searchInput: string
    status: string
    courseId: string
    handleSearch: (term: string) => void
    updateParams: (updates: Record<string, string>) => void
    handlePageChange: (page: number) => void
    handleRetry: () => void
}

type OfferFilters = {
    q: string
    status: string
    course_id: string
    page: string
    limit: string
}

async function fetchOffersFromApi(params: {
    q: string
    status: string
    course_id: string
    page: number
    limit: number
}): Promise<OfferListResponse> {
    const url = new URL("/api/offer", window.location.origin)
    if (params.q) url.searchParams.set("q", params.q)
    if (params.status !== "all") url.searchParams.set("status", params.status)
    if (params.course_id !== "all") url.searchParams.set("course_id", params.course_id)
    url.searchParams.set("page", String(params.page))
    url.searchParams.set("limit", String(params.limit))

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error("Failed to fetch offers")
    return res.json() as Promise<OfferListResponse>
}

function readOfferFiltersFromUrl(): OfferFilters {
    return {
        q: readUrlSearchParam("q"),
        status: readUrlSearchParam("status") || "all",
        course_id: readUrlSearchParam("course_id") || "all",
        page: readUrlSearchParam("page") || "1",
        limit: readUrlSearchParam("limit") || "10",
    }
}

function syncOfferFiltersToUrl(filters: OfferFilters) {
    applyUrlSearchParamUpdates({
        q: filters.q || null,
        status: filters.status === "all" ? null : filters.status,
        course_id: filters.course_id === "all" ? null : filters.course_id,
        page: filters.page === "1" ? null : filters.page,
        limit: filters.limit === "10" ? null : filters.limit,
    })
}

export function withOfferPageLogic(Component: ComponentType<OfferPageLogicProps>) {
    return function OfferPageContainer({
        initialData,
    }: {
        initialData: OfferDashboardPageData
    }) {
        const timeoutRef = useRef<NodeJS.Timeout | null>(null)

        const [filters, setFilters] = useState<OfferFilters>({
            q: initialData.query.q,
            status: initialData.query.status,
            course_id: initialData.query.course_id,
            page: initialData.query.page,
            limit: initialData.query.limit,
        })
        const [searchInput, setSearchInput] = useState(initialData.query.q)

        const updateParams = useCallback((updates: Record<string, string>) => {
            setFilters((current) => {
                const next = { ...current, ...updates } as OfferFilters
                if (!("page" in updates)) {
                    next.page = "1"
                }
                syncOfferFiltersToUrl(next)
                return next
            })
        }, [])

        useEffect(() => {
            const syncFiltersFromUrl = () => {
                const next = readOfferFiltersFromUrl()
                setFilters(next)
                setSearchInput(next.q)
            }

            window.addEventListener("popstate", syncFiltersFromUrl)
            return () => window.removeEventListener("popstate", syncFiltersFromUrl)
        }, [])

        const handleSearch = useCallback(
            (term: string) => {
                setSearchInput(term)

                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current)
                }

                timeoutRef.current = setTimeout(() => {
                    updateParams({ q: term.trim() })
                }, 400)
            },
            [updateParams]
        )

        useEffect(() => {
            return () => {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current)
                }
            }
        }, [])

        const page = parseInt(filters.page, 10) || 1
        const limit = parseInt(filters.limit, 10) || 10

        const matchesInitialQuery =
            filters.q === initialData.query.q &&
            filters.status === initialData.query.status &&
            filters.course_id === initialData.query.course_id &&
            filters.page === initialData.query.page &&
            filters.limit === initialData.query.limit

        const offersQuery = useQuery({
            queryKey: ["offers", filters.q, filters.status, filters.course_id, page, limit],
            queryFn: () =>
                fetchOffersFromApi({
                    q: filters.q,
                    status: filters.status,
                    course_id: filters.course_id,
                    page,
                    limit,
                }),
            initialData: matchesInitialQuery ? initialData.offers : undefined,
            placeholderData: keepPreviousData,
            staleTime: 5 * 60 * 1000, // Cache for 5 minutes for smoother navigation
            retry: false,
        })

        const handlePageChange = useCallback(
            (newPage: number) => {
                if (newPage < 1) return
                updateParams({ page: String(newPage) })
            },
            [updateParams]
        )

        const queryPagination = offersQuery.data?.pagination
        const pagination = queryPagination ? { ...queryPagination, page } : undefined

        return (
            <Component
                offers={offersQuery.data?.data ?? []}
                pagination={pagination}
                isLoading={offersQuery.isLoading && !offersQuery.data}
                isFetching={offersQuery.isFetching}
                isError={offersQuery.isError}
                q={filters.q}
                searchInput={searchInput}
                status={filters.status}
                courseId={filters.course_id}
                handleSearch={handleSearch}
                updateParams={updateParams}
                handlePageChange={handlePageChange}
                handleRetry={() => {
                    void offersQuery.refetch()
                }}
            />
        )
    }
}
