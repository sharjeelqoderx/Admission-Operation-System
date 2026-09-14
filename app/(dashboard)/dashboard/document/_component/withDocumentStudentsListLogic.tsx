"use client"

import type { ComponentType } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query"
import {
    applyUrlSearchParamUpdates,
    readUrlSearchParam,
} from "@/lib/navigation/replace-url-search-params"
import type {
    DocumentListPagination,
    DocumentStudentsListResponse,
} from "@/types/schemas/document"
import type { DocumentStudentRow } from "./DocumentTable"

const PAGE_LIMIT = 10

export type DocumentStudentsListLogicProps = {
    rows: DocumentStudentRow[]
    pagination: DocumentListPagination
    page: number
    isLoading: boolean
    isFetching: boolean
    isError: boolean
    q: string
    searchInput: string
    status: string
    hasActiveFilters: boolean
    onRetry: () => void
    handleSearch: (term: string) => void
    updateParams: (updates: Record<string, string>) => void
    handleResetFilters: () => void
    handlePageChange: (page: number) => void
    title?: string
    description?: string
    getViewHref?: (studentId: string) => string
}

type DocumentStudentsFilters = {
    q: string
    status: string
}

async function fetchDocumentStudents(
    filters: DocumentStudentsFilters,
    page: number,
    limit: number
): Promise<DocumentStudentsListResponse> {
    const url = new URL("/api/document", window.location.origin)
    if (filters.q) {
        url.searchParams.set("search", filters.q)
    }
    if (filters.status !== "all") {
        url.searchParams.set("status", filters.status)
    }
    url.searchParams.set("page", String(page))
    url.searchParams.set("limit", String(limit))

    const res = await fetch(url.toString())
    const json = await res.json()
    if (!res.ok) throw new Error(json?.error ?? "Failed to fetch students")
    return json as DocumentStudentsListResponse
}

function readDocumentStudentsFiltersFromUrl(): DocumentStudentsFilters {
    return {
        q: readUrlSearchParam("q"),
        status: readUrlSearchParam("status") || "all",
    }
}

const EMPTY_PAGINATION: DocumentListPagination = {
    total: 0,
    page: 1,
    limit: PAGE_LIMIT,
    totalPages: 0,
}

export function withDocumentStudentsListLogic(
    Component: ComponentType<DocumentStudentsListLogicProps>
) {
    return function DocumentStudentsListContainer({
        title,
        description,
        getViewHref,
    }: Pick<DocumentStudentsListLogicProps, "title" | "description" | "getViewHref"> = {}) {
        const queryClient = useQueryClient()
        const timeoutRef = useRef<NodeJS.Timeout | null>(null)
        const [page, setPage] = useState(1)
        const initialFilters = readDocumentStudentsFiltersFromUrl()
        const [filters, setFilters] = useState<DocumentStudentsFilters>(initialFilters)
        const [searchInput, setSearchInput] = useState(initialFilters.q)

        const updateParams = useCallback((updates: Record<string, string>) => {
            setPage(1)
            setFilters((current) => {
                const next = { ...current, ...updates } as DocumentStudentsFilters
                applyUrlSearchParamUpdates({
                    q: next.q || null,
                    status: next.status === "all" ? null : next.status,
                })
                return next
            })
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
            const syncFiltersFromUrl = () => {
                const next = readDocumentStudentsFiltersFromUrl()
                setFilters(next)
                setSearchInput(next.q)
                setPage(1)
            }

            window.addEventListener("popstate", syncFiltersFromUrl)
            return () => window.removeEventListener("popstate", syncFiltersFromUrl)
        }, [])

        useEffect(() => {
            return () => {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current)
                }
            }
        }, [])

        const { data, isLoading, isFetching, isError, refetch } = useQuery({
            queryKey: ["documents", "students", filters.q, filters.status, page, PAGE_LIMIT],
            queryFn: () => fetchDocumentStudents(filters, page, PAGE_LIMIT),
            placeholderData: keepPreviousData,
            staleTime: 60_000,
        })

        const prefetchPage = useCallback(
            (targetPage: number) => {
                void queryClient.prefetchQuery({
                    queryKey: [
                        "documents",
                        "students",
                        filters.q,
                        filters.status,
                        targetPage,
                        PAGE_LIMIT,
                    ],
                    queryFn: () => fetchDocumentStudents(filters, targetPage, PAGE_LIMIT),
                    staleTime: 60_000,
                })
            },
            [filters, queryClient]
        )

        // Keep the next page warm: page 1 → prefetch 2, page 2 → prefetch 3, etc.
        useEffect(() => {
            const totalPages = data?.pagination?.totalPages ?? 0
            const nextPage = page + 1
            if (!data || nextPage > totalPages) return
            prefetchPage(nextPage)
        }, [data, page, prefetchPage])

        const rows = useMemo(
            () => (Array.isArray(data?.data) ? data.data : []),
            [data?.data]
        )

        const pagination = data?.pagination ?? {
            ...EMPTY_PAGINATION,
            page,
        }

        const hasActiveFilters = filters.status !== "all" || Boolean(filters.q)

        const handleResetFilters = useCallback(() => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
            setSearchInput("")
            setPage(1)
            setFilters({ q: "", status: "all" })
            applyUrlSearchParamUpdates({ q: null, status: null })
        }, [])

        const handlePageChange = useCallback(
            (nextPage: number) => {
                const totalPages = pagination.totalPages
                const safePage = Math.min(Math.max(1, nextPage), Math.max(1, totalPages))
                setPage(safePage)
                if (safePage + 1 <= totalPages) {
                    prefetchPage(safePage + 1)
                }
            },
            [pagination.totalPages, prefetchPage]
        )

        return (
            <Component
                rows={rows}
                pagination={pagination}
                page={page}
                isLoading={isLoading && !data}
                isFetching={isFetching}
                isError={isError}
                q={filters.q}
                searchInput={searchInput}
                status={filters.status}
                hasActiveFilters={hasActiveFilters}
                onRetry={() => {
                    void refetch()
                }}
                handleSearch={handleSearch}
                updateParams={updateParams}
                handleResetFilters={handleResetFilters}
                handlePageChange={handlePageChange}
                title={title}
                description={description}
                getViewHref={getViewHref}
            />
        )
    }
}
