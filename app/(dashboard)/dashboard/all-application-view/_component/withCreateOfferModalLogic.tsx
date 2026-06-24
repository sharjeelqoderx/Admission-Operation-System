"use client"

import { useCallback, useMemo, useState, type ComponentType } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { DocumentTemplatesListResponse } from "@/types/schemas/document-template"
import type {
    OfferChecklistPreviewResponse,
    OfferTemplateChecklistPreview,
} from "@/types/schemas/offer"

async function fetchDocumentTemplates(): Promise<DocumentTemplatesListResponse> {
    const res = await fetch("/api/document-template")
    const json = await res.json()
    if (!res.ok) {
        throw new Error(json?.error ?? "Failed to fetch document templates")
    }
    return json
}

async function fetchOfferChecklistPreview(
    applicationId: string
): Promise<OfferChecklistPreviewResponse> {
    const res = await fetch(
        `/api/offer/checklist-preview?application_id=${encodeURIComponent(applicationId)}`
    )
    const json = await res.json()
    if (!res.ok) {
        throw new Error(json?.error ?? "Failed to fetch checklist preview")
    }
    return json
}

export type CreateOfferModalLogicProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    applicationId: string
    studentName?: string | null
    onOfferCreated?: (offerId: string) => void
    templates: DocumentTemplatesListResponse["data"]
    checklistByTemplateId: Record<string, OfferTemplateChecklistPreview>
    isLoading: boolean
    isError: boolean
    errorMessage: string
    onRetry: () => void
    selectedTemplateId: string | null
    onSelectTemplate: (templateId: string) => void
    onCreateOffer: () => void
    isCreating: boolean
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
        const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

        const templatesQuery = useQuery({
            queryKey: ["document-templates"],
            queryFn: fetchDocumentTemplates,
            enabled: open,
        })

        const checklistPreviewQuery = useQuery({
            queryKey: ["offer-checklist-preview", applicationId],
            queryFn: () => fetchOfferChecklistPreview(applicationId),
            enabled: open && Boolean(applicationId),
        })

        const templates = useMemo(() => {
            const rows = templatesQuery.data?.data
            return Array.isArray(rows) ? rows : []
        }, [templatesQuery.data?.data])

        const checklistByTemplateId = useMemo(() => {
            const rows = checklistPreviewQuery.data?.data?.templates
            if (!Array.isArray(rows)) return {}

            return rows.reduce<Record<string, OfferTemplateChecklistPreview>>((acc, row) => {
                acc[row.template_id] = row
                return acc
            }, {})
        }, [checklistPreviewQuery.data?.data?.templates])

        const createOfferMutation = useMutation({
            mutationFn: async (documentTemplateId: string) => {
                const res = await fetch("/api/offer", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        application_id: applicationId,
                        document_template_id: documentTemplateId,
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
                setSelectedTemplateId(null)
                onOpenChange(false)
                onOfferCreated?.(data.id)
            },
            onError: (mutationError: Error) => {
                toast.error(mutationError.message)
            },
        })

        const handleOpenChange = useCallback(
            (nextOpen: boolean) => {
                if (!nextOpen) {
                    setSelectedTemplateId(null)
                }
                onOpenChange(nextOpen)
            },
            [onOpenChange]
        )

        const handleSelectTemplate = useCallback((templateId: string) => {
            setSelectedTemplateId(templateId)
        }, [])

        const handleCreateOffer = useCallback(() => {
            if (!selectedTemplateId) {
                toast.error("Please select a template first")
                return
            }
            createOfferMutation.mutate(selectedTemplateId)
        }, [createOfferMutation, selectedTemplateId])

        const handleRetry = useCallback(() => {
            void templatesQuery.refetch()
            void checklistPreviewQuery.refetch()
        }, [checklistPreviewQuery, templatesQuery])

        const isLoading =
            (templatesQuery.isLoading || checklistPreviewQuery.isLoading) && templates.length === 0
        const isError =
            !isLoading &&
            (templatesQuery.isError || checklistPreviewQuery.isError) &&
            templates.length === 0
        const errorMessage =
            (templatesQuery.error instanceof Error
                ? templatesQuery.error.message
                : checklistPreviewQuery.error instanceof Error
                  ? checklistPreviewQuery.error.message
                  : "Failed to load offer templates")

        return (
            <Component
                open={open}
                onOpenChange={handleOpenChange}
                applicationId={applicationId}
                studentName={studentName}
                onOfferCreated={onOfferCreated}
                templates={templates}
                checklistByTemplateId={checklistByTemplateId}
                isLoading={isLoading}
                isError={isError}
                errorMessage={errorMessage}
                onRetry={handleRetry}
                selectedTemplateId={selectedTemplateId}
                onSelectTemplate={handleSelectTemplate}
                onCreateOffer={handleCreateOffer}
                isCreating={createOfferMutation.isPending}
            />
        )
    }
}
