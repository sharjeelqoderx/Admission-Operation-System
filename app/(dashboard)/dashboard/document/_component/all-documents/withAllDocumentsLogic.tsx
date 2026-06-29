"use client"

import type { ComponentType } from "react"
import { useCallback, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { AgentAllDocumentRow, AgentAllDocumentsResponse } from "@/types/schemas/document"

export type AllDocumentsPageLogicProps = {
    rows: AgentAllDocumentRow[]
    isLoading: boolean
    isError: boolean
    reviewingDocumentId: string | null
    rejectDialogOpen: boolean
    rejectTarget: AgentAllDocumentRow | null
    rejectErrorMessage?: string
    isRejectSubmitting: boolean
    onRetry: () => void
    onApprove: (documentId: string) => void
    onRejectRequest: (documentId: string) => void
    onRejectDialogOpenChange: (open: boolean) => void
    onRejectSubmit: (reason: string) => void
}

async function fetchAllDocuments() {
    const res = await fetch("/api/document/all")
    const json = await res.json()
    if (!res.ok) throw new Error(json?.error ?? "Failed to fetch documents")
    return json as AgentAllDocumentsResponse
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

export function withAllDocumentsLogic(Component: ComponentType<AllDocumentsPageLogicProps>) {
    return function AllDocumentsPageContainer() {
        const queryClient = useQueryClient()
        const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
        const [rejectTargetId, setRejectTargetId] = useState<string | null>(null)
        const [reviewingDocumentId, setReviewingDocumentId] = useState<string | null>(null)

        const documentsQuery = useQuery({
            queryKey: ["documents", "all"],
            queryFn: fetchAllDocuments,
        })

        const rows = useMemo(
            () => (Array.isArray(documentsQuery.data?.data) ? documentsQuery.data.data : []),
            [documentsQuery.data?.data]
        )

        const rejectTarget = useMemo(
            () => rows.find((row) => row.document_id === rejectTargetId) ?? null,
            [rejectTargetId, rows]
        )

        const updateCachedRow = useCallback(
            (
                documentId: string,
                updates: Partial<Pick<AgentAllDocumentRow, "status" | "feedback" | "review_id">>
            ) => {
                queryClient.setQueryData<AgentAllDocumentsResponse>(["documents", "all"], (current) => {
                    if (!current) return current
                    return {
                        ...current,
                        data: current.data.map((row) =>
                            row.document_id === documentId ? { ...row, ...updates } : row
                        ),
                    }
                })
            },
            [queryClient]
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
                updateCachedRow(data.document_id, {
                    status: data.status,
                    feedback: data.feedback,
                    review_id: data.id,
                })
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

        return (
            <Component
                rows={rows}
                isLoading={documentsQuery.isLoading}
                isError={documentsQuery.isError}
                reviewingDocumentId={reviewingDocumentId}
                rejectDialogOpen={rejectDialogOpen}
                rejectTarget={rejectTarget}
                rejectErrorMessage={rejectErrorMessage}
                isRejectSubmitting={reviewMutation.isPending && rejectDialogOpen}
                onRetry={() => {
                    void documentsQuery.refetch()
                }}
                onApprove={handleApprove}
                onRejectRequest={handleRejectRequest}
                onRejectDialogOpenChange={handleRejectDialogOpenChange}
                onRejectSubmit={handleRejectSubmit}
            />
        )
    }
}
