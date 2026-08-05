"use client"

import { useCallback, useMemo, type ComponentType } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type {
    OfferChecklistPreviewResponse,
    OfferTemplateChecklistPreview,
} from "@/types/schemas/offer"

async function fetchOfferChecklistPreview(
    applicationId: string
): Promise<OfferChecklistPreviewResponse> {
    const res = await fetch(
        `/api/offer/checklist-preview?application_id=${encodeURIComponent(applicationId)}`
    )
    const json = await res.json()
    if (!res.ok) {
        const details =
            typeof json?.details === "object" && json.details !== null
                ? JSON.stringify(json.details)
                : undefined
        throw new Error(json?.error ?? details ?? "Failed to fetch offer preview")
    }
    return json
}

export type CreateOfferModalLogicProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    applicationId: string
    studentName?: string | null
    onOfferCreated?: (offerId: string) => void
    programLabel: string | null
    templatePreview: OfferTemplateChecklistPreview | null
    isLoading: boolean
    isError: boolean
    errorMessage: string
    onRetry: () => void
    onCreateOffer: () => void
    isCreating: boolean
    canCreateOffer: boolean
}

type CreateOfferModalContainerProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    applicationId: string
    studentName?: string | null
    onOfferCreated?: (offerId: string) => void
}

export function withCreateOfferModalLogic(
    Component: ComponentType<CreateOfferModalLogicProps>
) {
    return function CreateOfferModalContainer({
        open,
        onOpenChange,
        applicationId,
        studentName,
        onOfferCreated,
    }: CreateOfferModalContainerProps) {
        const queryClient = useQueryClient()

        const previewQuery = useQuery({
            queryKey: ["offer-checklist-preview", applicationId],
            queryFn: () => fetchOfferChecklistPreview(applicationId),
            enabled: open && Boolean(applicationId),
        })

        const preview = previewQuery.data?.data

        const createOfferMutation = useMutation({
            mutationFn: async () => {
                const res = await fetch("/api/offer", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        application_id: applicationId,
                    }),
                })
                const json = await res.json()
                if (!res.ok) {
                    throw new Error(json.details ?? json.error ?? "Failed to create offer")
                }
                return json.data as { id: string }
            },
            onSuccess: (data) => {
                toast.success("Offer created successfully")
                queryClient.invalidateQueries({ queryKey: ["offers"] })
                queryClient.invalidateQueries({ queryKey: ["applications"] })
                queryClient.invalidateQueries({
                    queryKey: ["offer-checklist-preview", applicationId],
                })
                onOpenChange(false)
                onOfferCreated?.(data.id)
            },
            onError: (mutationError: Error) => {
                toast.error(mutationError.message)
            },
        })

        const handleCreateOffer = useCallback(() => {
            if (!preview?.template) {
                toast.error("No offer template is assigned to this program.")
                return
            }
            createOfferMutation.mutate()
        }, [createOfferMutation, preview?.template])

        const handleRetry = useCallback(() => {
            void previewQuery.refetch()
        }, [previewQuery])

        const isLoading = previewQuery.isLoading && !preview
        const isError = !isLoading && previewQuery.isError
        const errorMessage =
            previewQuery.error instanceof Error
                ? previewQuery.error.message
                : "Failed to load offer preview"

        const canCreateOffer = Boolean(preview?.template)

        return (
            <Component
                open={open}
                onOpenChange={onOpenChange}
                applicationId={applicationId}
                studentName={studentName}
                onOfferCreated={onOfferCreated}
                programLabel={preview?.program_label ?? null}
                templatePreview={preview?.template ?? null}
                isLoading={isLoading}
                isError={isError}
                errorMessage={errorMessage}
                onRetry={handleRetry}
                onCreateOffer={handleCreateOffer}
                isCreating={createOfferMutation.isPending}
                canCreateOffer={canCreateOffer}
            />
        )
    }
}
