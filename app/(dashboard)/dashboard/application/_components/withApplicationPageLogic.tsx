"use client"

import type { ComponentType } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { applyUrlSearchParamUpdates, readUrlSearchParam } from "@/lib/navigation/replace-url-search-params"
import type { ApplicationDashboardPageData, ApplicationListResponse } from "@/types/schemas/application"
import type { ApplicationListStats } from "@/types/schemas/application"
import type { ApplicationProfileRole } from "@/types/schemas/application"
import { Role } from "@/types/enums/role"

export type ApplicationPageLogicProps = {
    role?: ApplicationProfileRole
    canCreateApplication: boolean
    showStudentSearch: boolean
    applications: ApplicationListResponse["data"]
    stats: ApplicationListStats
    isLoading: boolean
    isFetching: boolean
    isError: boolean
    hasActiveFilters: boolean
    q: string
    searchInput: string
    status: string
    degreeId: string
    dateFrom: string
    dateTo: string
    handleSearch: (term: string) => void
    updateParams: (updates: Record<string, string>) => void
    handleResetFilters: () => void
    handleRetry: () => void
}

type ApplicationFilters = {
    q: string
    status: string
    degree_id: string
    date_from: string
    date_to: string
}

async function fetchApplicationsFromApi(params: ApplicationFilters) {
    const url = new URL("/api/application", window.location.origin)
    if (params.q) url.searchParams.set("q", params.q)
    if (params.status !== "all") url.searchParams.set("status", params.status)
    if (params.degree_id !== "all") url.searchParams.set("degree_id", params.degree_id)
    if (params.date_from) url.searchParams.set("date_from", params.date_from)
    if (params.date_to) url.searchParams.set("date_to", params.date_to)

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error("Failed to fetch applications")
    return res.json() as Promise<ApplicationListResponse>
}

function readApplicationFiltersFromUrl(): ApplicationFilters {
    return {
        q: readUrlSearchParam("q"),
        status: readUrlSearchParam("status") || "all",
        degree_id: readUrlSearchParam("degree_id") || "all",
        date_from: readUrlSearchParam("date_from"),
        date_to: readUrlSearchParam("date_to"),
    }
}

export function withApplicationPageLogic(Component: ComponentType<ApplicationPageLogicProps>) {
    return function ApplicationPageContainer({
        initialData,
    }: {
        initialData: ApplicationDashboardPageData
    }) {
        const timeoutRef = useRef<NodeJS.Timeout | null>(null)

        const [filters, setFilters] = useState<ApplicationFilters>({
            q: initialData.query.q,
            status: initialData.query.status,
            degree_id: initialData.query.degree_id,
            date_from: initialData.query.date_from,
            date_to: initialData.query.date_to,
        })
        const [searchInput, setSearchInput] = useState(initialData.query.q)

        const updateParams = useCallback((updates: Record<string, string>) => {
            setFilters((current) => {
                const next = { ...current, ...updates } as ApplicationFilters
                applyUrlSearchParamUpdates({
                    q: next.q || null,
                    status: next.status === "all" ? null : next.status,
                    degree_id: next.degree_id === "all" ? null : next.degree_id,
                    date_from: next.date_from || null,
                    date_to: next.date_to || null,
                })
                return next
            })
        }, [])

        useEffect(() => {
            const syncFiltersFromUrl = () => {
                const next = readApplicationFiltersFromUrl()
                setFilters(next)
                setSearchInput(next.q)
            }

            window.addEventListener("popstate", syncFiltersFromUrl)
            return () => window.removeEventListener("popstate", syncFiltersFromUrl)
        }, [])

        const matchesInitialQuery =
            filters.q === initialData.query.q &&
            filters.status === initialData.query.status &&
            filters.degree_id === initialData.query.degree_id &&
            filters.date_from === initialData.query.date_from &&
            filters.date_to === initialData.query.date_to

        const handleSearch = useCallback(
            (term: string) => {
                setSearchInput(term)

                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current)
                }

                timeoutRef.current = setTimeout(() => {
                    updateParams({ q: term.trim() })
                }, 300) // Reduced from 400ms to 300ms for faster response
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

        const { data: response, isLoading, isFetching, isError, refetch } = useQuery({
            queryKey: [
                "applications",
                filters.q,
                filters.status,
                filters.degree_id,
                filters.date_from,
                filters.date_to,
            ],
            queryFn: () => fetchApplicationsFromApi(filters),
            initialData: initialData.applications,
            retry: false,
            staleTime: Infinity, // Cache indefinitely to avoid refetch on navigation
        })

        const role = response?.role ?? initialData.applications.role
        const canCreateApplication = role === Role.AGENT || role === Role.STUDENT
        const showStudentSearch = role !== Role.STUDENT

        const applications = useMemo(
            () => (Array.isArray(response?.data) ? response.data : []),
            [response]
        )

        const stats = useMemo<ApplicationListStats>(
            () =>
                response?.stats ?? {
                    total: 0,
                    pending: 0,
                    accepted: 0,
                },
            [response]
        )

        const hasActiveFilters = useMemo(
            () =>
                Boolean(filters.q) ||
                filters.status !== "all" ||
                filters.degree_id !== "all" ||
                Boolean(filters.date_from) ||
                Boolean(filters.date_to),
            [filters]
        )

        const handleResetFilters = useCallback(() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            setSearchInput("")
            setFilters({
                q: "",
                status: "all",
                degree_id: "all",
                date_from: "",
                date_to: "",
            })
            applyUrlSearchParamUpdates({
                q: null,
                status: null,
                degree_id: null,
                date_from: null,
                date_to: null,
            })
        }, [])

        const handleRetry = useCallback(() => {
            refetch()
        }, [refetch])

        return (
            <Component
                role={role}
                canCreateApplication={canCreateApplication}
                showStudentSearch={showStudentSearch}
                applications={applications}
                stats={stats}
                isLoading={isLoading && !response}
                isFetching={isFetching}
                isError={isError}
                hasActiveFilters={hasActiveFilters}
                q={filters.q}
                searchInput={searchInput}
                status={filters.status}
                degreeId={filters.degree_id}
                dateFrom={filters.date_from}
                dateTo={filters.date_to}
                handleSearch={handleSearch}
                updateParams={updateParams}
                handleResetFilters={handleResetFilters}
                handleRetry={handleRetry}
            />
        )
    }
}
