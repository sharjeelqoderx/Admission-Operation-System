"use client"

import type { ComponentType } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
    applyUrlSearchParamUpdates,
    readUrlSearchParam,
} from "@/lib/navigation/replace-url-search-params"
import type {
    AgentAllDocumentRow,
    AgentAllDocumentsResponse,
    DocumentListPagination,
} from "@/types/schemas/document"

const PAGE_LIMIT = 10

export type AllDocumentsPageLogicProps = {
    rows: AgentAllDocumentRow[]
    pagination: DocumentListPagination
    page: number
    isLoading: boolean
    isFetching: boolean
    isError: boolean
    q: string
    searchInput: string
    status: string
    hasActiveFilters: boolean
    reviewingDocumentId: string | null
    rejectDialogOpen: boolean
    rejectTarget: AgentAllDocumentRow | null
    rejectErrorMessage?: string
    isRejectSubmitting: boolean
    onRetry: () => void
    handleSearch: (term: string) => void
    updateParams: (updates: Record<string, string>) => void
    handleResetFilters: () => void
    handlePageChange: (page: number) => void
    onApprove: (documentId: string) => void
    onRejectRequest: (documentId: string) => void
    onRejectDialogOpenChange: (open: boolean) => void
    onRejectSubmit: (reason: string) => void
}

type DocumentAllFilters = {
    q: string
    status: string
}

async function fetchAllDocuments(
    filters: DocumentAllFilters,
    page: number,
    limit: number
): Promise<AgentAllDocumentsResponse> {
    const url = new URL("/api/document/all", window.location.origin)
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
    if (!res.ok) throw new Error(json?.error ?? "Failed to fetch documents")
    return json as AgentAllDocumentsResponse
}

function readAllDocumentsFiltersFromUrl(): DocumentAllFilters {
    return {
        q: readUrlSearchParam("q"),
        status: readUrlSearchParam("status") || "all",
    }
}

async function reviewDocument(
    documentId: string,
    payload: { status: "APPROVED" | "REJECTED"; feedback?: string }
) {
    const res = await fetch(`/api/document/${documentId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json?.error ?? "Failed to update document review")
    return json.data as {
        id: string
        status: string
        feedback: string | null
        document_id: string
        updated_at: string
    }
}

const EMPTY_PAGINATION: DocumentListPagination = {
    total: 0,
    page: 1,
    limit: PAGE_LIMIT,
    totalPages: 0,
}

export function withAllDocumentsLogic(Component: ComponentType<AllDocumentsPageLogicProps>) {
    return function AllDocumentsPageContainer() {
        const queryClient = useQueryClient()
        const timeoutRef = useRef<NodeJS.Timeout | null>(null)
        const lastPaginationRef = useRef<DocumentListPagination>(EMPTY_PAGINATION)
        const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
        const [rejectTargetId, setRejectTargetId] = useState<string | null>(null)
        const [reviewingDocumentId, setReviewingDocumentId] = useState<string | null>(null)
        const [page, setPage] = useState(1)
        const initialFilters = readAllDocumentsFiltersFromUrl()
        const [filters, setFilters] = useState<DocumentAllFilters>(initialFilters)
        const [searchInput, setSearchInput] = useState(initialFilters.q)

        const updateParams = useCallback((updates: Record<string, string>) => {
            setPage(1)
            lastPaginationRef.current = EMPTY_PAGINATION
            setFilters((current) => {
                const next = { ...current, ...updates } as DocumentAllFilters
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
                const next = readAllDocumentsFiltersFromUrl()
                setFilters(next)
                setSearchInput(next.q)
                setPage(1)
                lastPaginationRef.current = EMPTY_PAGINATION
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

        const documentsQuery = useQuery({
            queryKey: ["documents", "all", filters.q, filters.status, page, PAGE_LIMIT],
            queryFn: () => fetchAllDocuments(filters, page, PAGE_LIMIT),
            staleTime: 60_000,
        })

        const prefetchPage = useCallback(
            (targetPage: number) => {
                if (targetPage < 1) return

                void queryClient.prefetchQuery({
                    queryKey: [
                        "documents",
                        "all",
                        filters.q,
                        filters.status,
                        targetPage,
                        PAGE_LIMIT,
                    ],
                    queryFn: () => fetchAllDocuments(filters, targetPage, PAGE_LIMIT),
                    staleTime: 60_000,
                })
            },
            [filters.q, filters.status, queryClient]
        )

        // Prefetch page 2 in parallel with the initial page 1 fetch.
        useEffect(() => {
            prefetchPage(2)
        }, [prefetchPage])

        // Keep the next page warm: page 1 → prefetch 2, page 2 → prefetch 3, etc.
        useEffect(() => {
            const totalPages =
                documentsQuery.data?.pagination?.totalPages ??
                lastPaginationRef.current.totalPages
            const nextPage = page + 1
            if (nextPage > totalPages) return
            prefetchPage(nextPage)
        }, [documentsQuery.data?.pagination?.totalPages, page, prefetchPage])

        if (documentsQuery.data?.pagination) {
            lastPaginationRef.current = documentsQuery.data.pagination
        }

        const isPageReady = documentsQuery.data?.pagination?.page === page
        const isPageLoading = documentsQuery.isFetching && !isPageReady

        const rows = useMemo(
            () =>
                isPageReady && Array.isArray(documentsQuery.data?.data)
                    ? documentsQuery.data.data
                    : [],
            [documentsQuery.data?.data, isPageReady]
        )

        const pagination = documentsQuery.data?.pagination ?? {
            ...lastPaginationRef.current,
            page,
        }

        const rejectTarget = useMemo(
            () => rows.find((row) => row.document_id === rejectTargetId) ?? null,
            [rejectTargetId, rows]
        )

        const reviewMutation = useMutation({
            mutationFn: ({
                documentId,
                status,
                feedback,
            }: {
                documentId: string
                status: "APPROVED" | "REJECTED"
                feedback?: string
            }) => reviewDocument(documentId, { status, feedback }),
            onMutate: ({ documentId }) => {
                setReviewingDocumentId(documentId)
            },
            onSuccess: (data) => {
                queryClient.setQueriesData<AgentAllDocumentsResponse>(
                    { queryKey: ["documents", "all", filters.q, filters.status] },
                    (current) => {
                        if (!current) return current
                        return {
                            ...current,
                            data: current.data.map((row) => {
                                if (row.document_id !== data.document_id) return row

                                const rejectionHistory =
                                    data.status === "REJECTED" && data.feedback
                                        ? [
                                              {
                                                  feedback: data.feedback,
                                                  created_at: data.updated_at,
                                              },
                                              ...row.rejection_history,
                                          ]
                                        : row.rejection_history

                                return {
                                    ...row,
                                    status: data.status,
                                    feedback: data.feedback,
                                    review_id: data.id,
                                    rejection_history: rejectionHistory,
                                }
                            }),
                        }
                    }
                )
                queryClient.invalidateQueries({ queryKey: ["documents"] })
                queryClient.invalidateQueries({ queryKey: ["documents", "students"] })
                setRejectDialogOpen(false)
                setRejectTargetId(null)
            },
            onSettled: () => {
                setReviewingDocumentId(null)
            },
        })

        const handleApprove = useCallback(
            (documentId: string) => {
                reviewMutation.mutate({ documentId, status: "APPROVED" })
            },
            [reviewMutation]
        )

        const handleRejectRequest = useCallback((documentId: string) => {
            setRejectTargetId(documentId)
            setRejectDialogOpen(true)
        }, [])

        const handleRejectDialogOpenChange = useCallback((open: boolean) => {
            setRejectDialogOpen(open)
            if (!open) {
                setRejectTargetId(null)
            }
        }, [])

        const handleRejectSubmit = useCallback(
            (reason: string) => {
                if (!rejectTargetId) return
                reviewMutation.mutate({
                    documentId: rejectTargetId,
                    status: "REJECTED",
                    feedback: reason,
                })
            },
            [rejectTargetId, reviewMutation]
        )

        const rejectErrorMessage =
            reviewMutation.error instanceof Error && rejectDialogOpen
                ? reviewMutation.error.message
                : undefined

        const hasActiveFilters = filters.status !== "all" || Boolean(filters.q)

        const handleResetFilters = useCallback(() => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
            setSearchInput("")
            setPage(1)
            lastPaginationRef.current = EMPTY_PAGINATION
            setFilters({ q: "", status: "all" })
            applyUrlSearchParamUpdates({ q: null, status: null })
        }, [])

        const handlePageChange = useCallback(
            (nextPage: number) => {
                const totalPages =
                    lastPaginationRef.current.totalPages || pagination.totalPages
                const safePage = Math.min(Math.max(1, nextPage), Math.max(1, totalPages))
                if (safePage + 1 <= totalPages) {
                    prefetchPage(safePage + 1)
                }
                setPage(safePage)
            },
            [pagination.totalPages, prefetchPage]
        )

        return (
            <Component
                rows={rows}
                pagination={pagination}
                page={page}
                isLoading={
                    (documentsQuery.isLoading && !documentsQuery.data) || isPageLoading
                }
                isFetching={documentsQuery.isFetching}
                isError={documentsQuery.isError}
                q={filters.q}
                searchInput={searchInput}
                status={filters.status}
                hasActiveFilters={hasActiveFilters}
                reviewingDocumentId={reviewingDocumentId}
                rejectDialogOpen={rejectDialogOpen}
                rejectTarget={rejectTarget}
                rejectErrorMessage={rejectErrorMessage}
                isRejectSubmitting={reviewMutation.isPending && rejectDialogOpen}
                onRetry={() => {
                    void documentsQuery.refetch()
                }}
                handleSearch={handleSearch}
                updateParams={updateParams}
                handleResetFilters={handleResetFilters}
                handlePageChange={handlePageChange}
                onApprove={handleApprove}
                onRejectRequest={handleRejectRequest}
                onRejectDialogOpenChange={handleRejectDialogOpenChange}
                onRejectSubmit={handleRejectSubmit}
            />
        )
    }
}
