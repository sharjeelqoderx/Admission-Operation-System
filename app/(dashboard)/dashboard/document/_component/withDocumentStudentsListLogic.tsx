"use client"

import type { ComponentType } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
    applyUrlSearchParamUpdates,
    readUrlSearchParam,
} from "@/lib/navigation/replace-url-search-params"
import type { DocumentStudentRow } from "./DocumentTable"

export type DocumentStudentsListLogicProps = {
    rows: DocumentStudentRow[]
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
    title?: string
    description?: string
    getViewHref?: (studentId: string) => string
}

type DocumentStudentsFilters = {
    q: string
    status: string
}

async function fetchDocumentStudents(filters: DocumentStudentsFilters) {
    const url = new URL("/api/document", window.location.origin)
    if (filters.q) {
        url.searchParams.set("search", filters.q)
    }
    if (filters.status !== "all") {
        url.searchParams.set("status", filters.status)
    }

    const res = await fetch(url.toString())
    const json = await res.json()
    if (!res.ok) throw new Error(json?.error ?? "Failed to fetch students")
    return json as { data: DocumentStudentRow[]; role: string }
}

function readDocumentStudentsFiltersFromUrl(): DocumentStudentsFilters {
    return {
        q: readUrlSearchParam("q"),
        status: readUrlSearchParam("status") || "all",
    }
}

export function withDocumentStudentsListLogic(
    Component: ComponentType<DocumentStudentsListLogicProps>
) {
    return function DocumentStudentsListContainer({
        title,
        description,
        getViewHref,
    }: Pick<DocumentStudentsListLogicProps, "title" | "description" | "getViewHref"> = {}) {
        const timeoutRef = useRef<NodeJS.Timeout | null>(null)
        const initialFilters = readDocumentStudentsFiltersFromUrl()
        const [filters, setFilters] = useState<DocumentStudentsFilters>(initialFilters)
        const [searchInput, setSearchInput] = useState(initialFilters.q)

        const updateParams = useCallback((updates: Record<string, string>) => {
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
            queryKey: ["documents", "students", filters.q, filters.status],
            queryFn: () => fetchDocumentStudents(filters),
        })

        const rows = useMemo(
            () => (Array.isArray(data?.data) ? data.data : []),
            [data?.data]
        )

        const hasActiveFilters = filters.status !== "all" || Boolean(filters.q)

        const handleResetFilters = useCallback(() => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
            setSearchInput("")
            setFilters({ q: "", status: "all" })
            applyUrlSearchParamUpdates({ q: null, status: null })
        }, [])

        return (
            <Component
                rows={rows}
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
                title={title}
                description={description}
                getViewHref={getViewHref}
            />
        )
    }
}
