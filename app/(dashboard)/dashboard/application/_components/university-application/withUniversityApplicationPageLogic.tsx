"use client"

import type { ComponentType } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
    applyUrlSearchParamUpdates,
    readUrlSearchParam,
} from "@/lib/navigation/replace-url-search-params"
import { useCreateOfferAction } from "@/app/(dashboard)/dashboard/all-application-view/_component/useCreateOfferAction"
import type {
    UniversityApplicationListItem,
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
    reviewingApplicationId: string | null
    rejectDialogOpen: boolean
    rejectTarget: UniversityApplicationListItem | null
    isRejectSubmitting: boolean
    rejectErrorMessage?: string
    deferDialogOpen: boolean
    deferTarget: UniversityApplicationListItem | null
    isDeferSubmitting: boolean
    deferErrorMessage?: string
    missingTemplateAlert: {
        open: boolean
        title: string
        description: string
        allowCreateWithoutTemplate: boolean
    }
    isCreatingOfferWithoutTemplate: boolean
    onSearchChange: (value: string) => void
    onTabChange: (value: UniversityApplicationTab) => void
    onTabHover: (value: UniversityApplicationTab) => void
    onPageChange: (page: number) => void
    onApprove: (application: UniversityApplicationListItem) => void
    onRejectRequest: (application: UniversityApplicationListItem) => void
    onDeferRequest: (application: UniversityApplicationListItem) => void
    onRejectDialogOpenChange: (open: boolean) => void
    onRejectSubmit: (reason: string) => void
    onDeferDialogOpenChange: (open: boolean) => void
    onDeferSubmit: (reason: string, newIntakeDate: string) => void
    onCreateOfferWithoutTemplate: () => void
    onMissingTemplateAlertOpenChange: (open: boolean) => void
}

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

async function rejectApplication(applicationId: string, feedback: string) {
    const res = await fetch(`/api/application/${applicationId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED", feedback }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json?.error ?? "Failed to reject application")
    return json.data
}

async function deferApplication(applicationId: string, reason: string, newIntakeDate: string) {
    const res = await fetch(`/api/university/applications/${applicationId}/defer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, new_intake_date: newIntakeDate }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json?.error ?? "Failed to defer application")
    return json.data
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
        initialOverview?: UniversityApplicationListResponse
        initialQuery?: UniversityApplicationInitialQuery
    }) {
        const queryClient = useQueryClient()
        const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
        const urlQuery = readUniversityFiltersFromUrl()

        const [filters, setFilters] = useState(initialQuery ?? urlQuery)
        const [searchInput, setSearchInput] = useState((initialQuery ?? urlQuery).q)
        const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
        const [rejectTarget, setRejectTarget] = useState<UniversityApplicationListItem | null>(
            null
        )
        const [deferDialogOpen, setDeferDialogOpen] = useState(false)
        const [deferTarget, setDeferTarget] = useState<UniversityApplicationListItem | null>(null)

        const {
            handleCreateOffer,
            handleCreateOfferWithoutTemplate,
            isCreatingOffer,
            isCreatingOfferWithoutTemplate,
            pendingApplicationId,
            missingTemplateAlert,
            closeMissingTemplateAlert,
        } = useCreateOfferAction({
            invalidateQueryKeys: [["university-applications"]],
        })

        const updateFilters = useCallback((updates: Partial<UniversityApplicationInitialQuery>) => {
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

        const matchesInitialQuery = Boolean(
            initialOverview &&
                initialQuery &&
                filters.q === initialQuery.q &&
                filters.page === initialQuery.page &&
                filters.tab === initialQuery.tab
        )

        const applicationsQuery = useQuery({
            queryKey: ["university-applications", filters.q, filters.tab, filters.page],
            queryFn: () =>
                fetchUniversityApplications({
                    q: filters.q,
                    tab: filters.tab,
                    page: filters.page,
                }),
            initialData: matchesInitialQuery ? initialOverview : undefined,
            placeholderData: keepPreviousData,
            staleTime: 60_000,
            gcTime: 300_000,
            refetchOnWindowFocus: false,
        })

        const rejectMutation = useMutation({
            mutationFn: ({
                applicationId,
                reason,
            }: {
                applicationId: string
                reason: string
            }) => rejectApplication(applicationId, reason),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["university-applications"] })
                queryClient.invalidateQueries({ queryKey: ["applications"] })
                setRejectDialogOpen(false)
                setRejectTarget(null)
            },
        })

        const deferMutation = useMutation({
            mutationFn: ({
                applicationId,
                reason,
                newIntakeDate,
            }: {
                applicationId: string
                reason: string
                newIntakeDate: string
            }) => deferApplication(applicationId, reason, newIntakeDate),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["university-applications"] })
                queryClient.invalidateQueries({ queryKey: ["applications"] })
                setDeferDialogOpen(false)
                setDeferTarget(null)
            },
        })

        const overview = useMemo(() => {
            const data = applicationsQuery.data ?? {
                tab_counts: initialOverview?.tab_counts ?? {
                    all: 0,
                    pending_review: 0,
                    awaiting_signature: 0,
                    recently_completed: 0,
                    rejected: 0,
                    defer_intake: 0,
                },
                data: [],
                pagination: initialOverview?.pagination ?? {
                    total: 0,
                    page: 1,
                    limit: 10,
                    totalPages: 0,
                },
            }
            const currentPage = parseInt(filters.page, 10) || 1

            return {
                ...data,
                pagination: {
                    total: data.pagination?.total ?? 0,
                    page: currentPage,
                    limit: data.pagination?.limit ?? 10,
                    totalPages: data.pagination?.totalPages ?? 0,
                },
            }
        }, [
            applicationsQuery.data,
            filters.page,
            initialOverview?.pagination,
            initialOverview?.tab_counts,
        ])

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

        const handleApprove = useCallback(
            (application: UniversityApplicationListItem) => {
                if (!application.can_approve_for_signature) return
                handleCreateOffer({
                    applicationId: application.id,
                    studentName: application.student_name,
                })
            },
            [handleCreateOffer]
        )

        const handleRejectRequest = useCallback((application: UniversityApplicationListItem) => {
            if (!application.can_reject) return
            setRejectTarget(application)
            setRejectDialogOpen(true)
        }, [])

        const handleDeferRequest = useCallback((application: UniversityApplicationListItem) => {
            if (!application.can_reject) return
            setDeferTarget(application)
            setDeferDialogOpen(true)
        }, [])

        const handleRejectDialogOpenChange = useCallback((open: boolean) => {
            setRejectDialogOpen(open)
            if (!open) {
                setRejectTarget(null)
            }
        }, [])

        const handleRejectSubmit = useCallback(
            (reason: string) => {
                if (!rejectTarget) return
                rejectMutation.mutate({ applicationId: rejectTarget.id, reason })
            },
            [rejectMutation, rejectTarget]
        )

        const handleDeferDialogOpenChange = useCallback((open: boolean) => {
            setDeferDialogOpen(open)
            if (!open) setDeferTarget(null)
        }, [])

        const handleDeferSubmit = useCallback(
            (reason: string, newIntakeDate: string) => {
                if (!deferTarget) return
                deferMutation.mutate({
                    applicationId: deferTarget.id,
                    reason,
                    newIntakeDate,
                })
            },
            [deferMutation, deferTarget]
        )

        const reviewingApplicationId =
            (isCreatingOffer ? pendingApplicationId : null) ??
            (rejectMutation.isPending ? rejectTarget?.id ?? null : null) ??
            (deferMutation.isPending ? deferTarget?.id ?? null : null)

        const rejectErrorMessage =
            rejectMutation.error instanceof Error && rejectDialogOpen
                ? rejectMutation.error.message
                : undefined

        const deferErrorMessage =
            deferMutation.error instanceof Error && deferDialogOpen
                ? deferMutation.error.message
                : undefined

        return (
            <Component
                overview={overview}
                searchValue={searchInput}
                activeTab={filters.tab}
                isFetching={applicationsQuery.isFetching}
                reviewingApplicationId={reviewingApplicationId}
                rejectDialogOpen={rejectDialogOpen}
                rejectTarget={rejectTarget}
                isRejectSubmitting={rejectMutation.isPending}
                rejectErrorMessage={rejectErrorMessage}
                deferDialogOpen={deferDialogOpen}
                deferTarget={deferTarget}
                isDeferSubmitting={deferMutation.isPending}
                deferErrorMessage={deferErrorMessage}
                missingTemplateAlert={missingTemplateAlert}
                isCreatingOfferWithoutTemplate={isCreatingOfferWithoutTemplate}
                onSearchChange={handleSearchChange}
                onTabChange={handleTabChange}
                onTabHover={handleTabHover}
                onPageChange={(nextPage) => updateFilters({ page: String(nextPage) })}
                onApprove={handleApprove}
                onRejectRequest={handleRejectRequest}
                onDeferRequest={handleDeferRequest}
                onRejectDialogOpenChange={handleRejectDialogOpenChange}
                onRejectSubmit={handleRejectSubmit}
                onDeferDialogOpenChange={handleDeferDialogOpenChange}
                onDeferSubmit={handleDeferSubmit}
                onCreateOfferWithoutTemplate={handleCreateOfferWithoutTemplate}
                onMissingTemplateAlertOpenChange={(open) => {
                    if (!open) closeMissingTemplateAlert()
                }}
            />
        )
    }
}
