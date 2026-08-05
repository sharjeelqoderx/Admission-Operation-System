"use client"

import type { ComponentType } from "react"
import { useCallback, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type {
    UniversityApplicationDetail,
    UniversityApplicationDetailPageData,
} from "@/types/schemas/university-application"

export type UniversityApplicationDetailLogicProps = {
    applicationId: string
    detail?: UniversityApplicationDetail
    isLoading: boolean
    isError: boolean
    errorMessage: string
    rejectDialogOpen: boolean
    isReviewSubmitting: boolean
    reviewErrorMessage?: string
    onRetry: () => void
    onRejectRequest: () => void
    onRejectDialogOpenChange: (open: boolean) => void
    onRejectSubmit: (reason: string) => void
}

async function fetchUniversityApplicationDetail(applicationId: string) {
    const res = await fetch(`/api/university/applications/${applicationId}`)
    const json = await res.json()
    if (!res.ok) {
        throw new Error(json?.error ?? "Failed to fetch application detail")
    }
    return json.data as UniversityApplicationDetail
}

async function reviewApplication(
    applicationId: string,
    payload: { status: "REJECTED"; feedback: string }
) {
    const res = await fetch(`/api/application/${applicationId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json?.error ?? "Failed to update application review")
    return json.data
}

export function withUniversityApplicationDetailLogic(
    Component: ComponentType<UniversityApplicationDetailLogicProps>
) {
    return function UniversityApplicationDetailContainer({
        applicationId,
        initialData,
    }: {
        applicationId: string
        initialData: UniversityApplicationDetailPageData
    }) {
        const queryClient = useQueryClient()
        const [rejectDialogOpen, setRejectDialogOpen] = useState(false)

        const detailQuery = useQuery({
            queryKey: ["university-application-detail", applicationId],
            queryFn: () => fetchUniversityApplicationDetail(applicationId),
            initialData: initialData.detail ?? undefined,
            retry: false,
        })

        const reviewMutation = useMutation({
            mutationFn: (reason: string) =>
                reviewApplication(applicationId, { status: "REJECTED", feedback: reason }),
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: ["university-application-detail", applicationId],
                })
                queryClient.invalidateQueries({ queryKey: ["university-applications"] })
                queryClient.invalidateQueries({ queryKey: ["applications"] })
                setRejectDialogOpen(false)
            },
        })

        const detail = detailQuery.data ?? initialData.detail ?? undefined
        const isLoading = detailQuery.isLoading && !detail
        const isError =
            !detail && !isLoading && (Boolean(initialData.error) || detailQuery.isError)
        const errorMessage =
            initialData.error ??
            (detailQuery.error instanceof Error
                ? detailQuery.error.message
                : "Application not found")

        const handleRejectRequest = useCallback(() => {
            setRejectDialogOpen(true)
        }, [])

        const handleRejectDialogOpenChange = useCallback((open: boolean) => {
            setRejectDialogOpen(open)
        }, [])

        const handleRejectSubmit = useCallback(
            (reason: string) => {
                reviewMutation.mutate(reason)
            },
            [reviewMutation]
        )

        const reviewErrorMessage =
            reviewMutation.error instanceof Error && rejectDialogOpen
                ? reviewMutation.error.message
                : undefined

        return (
            <Component
                applicationId={applicationId}
                detail={detail}
                isLoading={isLoading}
                isError={isError}
                errorMessage={errorMessage}
                rejectDialogOpen={rejectDialogOpen}
                isReviewSubmitting={reviewMutation.isPending}
                reviewErrorMessage={reviewErrorMessage}
                onRetry={() => {
                    void detailQuery.refetch()
                }}
                onRejectRequest={handleRejectRequest}
                onRejectDialogOpenChange={handleRejectDialogOpenChange}
                onRejectSubmit={handleRejectSubmit}
            />
        )
    }
}
