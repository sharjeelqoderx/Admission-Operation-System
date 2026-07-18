"use client"

import type { ComponentType } from "react"
import { useCallback, useMemo, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
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
    isError: boolean
    hasActiveFilters: boolean
    q: string
    status: string
    degreeId: string
    dateFrom: string
    dateTo: string
    handleSearch: (term: string) => void
    updateParams: (updates: Record<string, string>) => void
    handleResetFilters: () => void
    handleRetry: () => void
}

async function fetchApplicationsFromApi(params: {
    q: string
    status: string
    degreeId: string
    dateFrom: string
    dateTo: string
}) {
    const url = new URL("/api/application", window.location.origin)
    if (params.q) url.searchParams.set("q", params.q)
    if (params.status !== "all") url.searchParams.set("status", params.status)
    if (params.degreeId !== "all") url.searchParams.set("degree_id", params.degreeId)
    if (params.dateFrom) url.searchParams.set("date_from", params.dateFrom)
    if (params.dateTo) url.searchParams.set("date_to", params.dateTo)

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error("Failed to fetch applications")
    return res.json() as Promise<ApplicationListResponse>
}

export function withApplicationPageLogic(Component: ComponentType<ApplicationPageLogicProps>) {
    return function ApplicationPageContainer({
        initialData,
    }: {
        initialData: ApplicationDashboardPageData
    }) {
        const searchParams = useSearchParams()
        const router = useRouter()
        const pathname = usePathname()
        const timeoutRef = useRef<NodeJS.Timeout | null>(null)

        const q = searchParams.get("q") || ""
        const status = searchParams.get("status") || "all"
        const degreeId = searchParams.get("degree_id") || "all"
        const dateFrom = searchParams.get("date_from") || ""
        const dateTo = searchParams.get("date_to") || ""

        const matchesInitialQuery =
            q === initialData.query.q &&
            status === initialData.query.status &&
            degreeId === initialData.query.degree_id &&
            dateFrom === initialData.query.date_from &&
            dateTo === initialData.query.date_to

        const updateParams = useCallback(
            (updates: Record<string, string>) => {
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

        const handleSearch = useCallback(
            (term: string) => {
                if (timeoutRef.current) clearTimeout(timeoutRef.current)
                timeoutRef.current = setTimeout(() => {
                    updateParams({ q: term })
                }, 400)
            },
            [updateParams]
        )

        const { data: response, isLoading, isError, refetch } = useQuery({
            queryKey: ["applications", q, status, degreeId, dateFrom, dateTo],
            queryFn: () => fetchApplicationsFromApi({ q, status, degreeId, dateFrom, dateTo }),
            initialData: matchesInitialQuery ? initialData.applications : undefined,
            retry: false,
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
                Boolean(q) ||
                status !== "all" ||
                degreeId !== "all" ||
                Boolean(dateFrom) ||
                Boolean(dateTo),
            [q, status, degreeId, dateFrom, dateTo]
        )

        const handleResetFilters = useCallback(() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            router.replace(pathname, { scroll: false })
        }, [pathname, router])

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
                isError={isError}
                hasActiveFilters={hasActiveFilters}
                q={q}
                status={status}
                degreeId={degreeId}
                dateFrom={dateFrom}
                dateTo={dateTo}
                handleSearch={handleSearch}
                updateParams={updateParams}
                handleResetFilters={handleResetFilters}
                handleRetry={handleRetry}
            />
        )
    }
}
