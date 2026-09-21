"use client"

import React, { useCallback, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type {
    DocumentTemplateDetailResponse,
    DocumentTemplateListItem,
    DocumentTemplatesListResponse,
    TemplateLocale,
} from "@/types/schemas/document-template"
import type { DocumentTemplateDates } from "@/lib/document-template/date-variables"
import type { DocumentTemplateWatermark } from "@/lib/document-template/watermark"
import {
    DOCUMENT_TEMPLATES_QUERY_KEY,
    releaseProgramsInOptionsCache,
    removeDocumentTemplateFromCache,
    syncTemplateProgramsInOptionsCache,
    upsertDocumentTemplateInCache,
} from "@/lib/document-template/query-cache"

export type DocumentTemplateListLogicProps = {
    templates: DocumentTemplateListItem[]
    canCreateTemplate: boolean
    canDeleteTemplate: boolean
    isLoading: boolean
    isError: boolean
    errorMessage?: string
    isDeleting: boolean
    deletingId: string | null
    cloningId: string | null
    deleteError: string | null
    deleteTemplateById: (id: string) => Promise<void>
    cloneTemplate: (payload: {
        sourceId: string
        title: string
        body_html: string
        locale: TemplateLocale
        template_dates: DocumentTemplateDates
        watermark: DocumentTemplateWatermark
        course_ids: string[]
    }) => Promise<DocumentTemplateListItem | null>
    clearDeleteError: () => void
    refetchTemplates: () => void
}

function formatApiError(
    json: { error?: string; details?: string },
    fallback: string
): string {
    const base = json?.error ?? fallback
    if (json?.details && typeof json.details === "string") {
        return `${base}: ${json.details}`
    }
    return base
}

async function fetchDocumentTemplates(): Promise<DocumentTemplatesListResponse> {
    const res = await fetch("/api/document-template")
    const json = await res.json()
    if (!res.ok) {
        throw new Error(json?.error ?? "Failed to fetch document templates")
    }
    return json
}

export function withDocumentTemplatePageLogic<P extends DocumentTemplateListLogicProps>(
    Component: React.ComponentType<P>
) {
    return function DocumentTemplatePageContainer({
        initialTemplates,
        canCreateTemplate,
        canDeleteTemplate,
    }: {
        initialTemplates?: DocumentTemplateListItem[]
        canCreateTemplate: boolean
        canDeleteTemplate: boolean
    }) {
        const queryClient = useQueryClient()
        const [deleteError, setDeleteError] = useState<string | null>(null)
        const [deletingId, setDeletingId] = useState<string | null>(null)
        const [cloningId, setCloningId] = useState<string | null>(null)

        const templatesQuery = useQuery({
            queryKey: DOCUMENT_TEMPLATES_QUERY_KEY,
            queryFn: fetchDocumentTemplates,
            initialData: initialTemplates !== undefined ? { data: initialTemplates } : undefined,
            staleTime: Infinity,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
        })

        const templates = useMemo(
            () => templatesQuery.data?.data ?? [],
            [templatesQuery.data?.data]
        )

        const deleteMutation = useMutation({
            mutationFn: async (id: string) => {
                const res = await fetch(`/api/document-template/${id}`, {
                    method: "DELETE",
                })
                const json = await res.json()
                if (!res.ok) {
                    throw new Error(
                        formatApiError(json, "Failed to delete document template")
                    )
                }
                return { id }
            },
            onSuccess: ({ id }) => {
                const cached = queryClient.getQueryData<DocumentTemplatesListResponse>(
                    DOCUMENT_TEMPLATES_QUERY_KEY
                )
                const previous = cached?.data.find((row) => row.id === id)
                removeDocumentTemplateFromCache(queryClient, id)
                releaseProgramsInOptionsCache(
                    queryClient,
                    (previous?.courses ?? []).map((course) => ({
                        id: course.id,
                        label: course.label,
                    }))
                )
            },
        })

        const cloneMutation = useMutation({
            mutationFn: async (payload: {
                title: string
                body_html: string
                locale: TemplateLocale
                template_dates: DocumentTemplateDates
                watermark: DocumentTemplateWatermark
                course_ids: string[]
            }) => {
                const res = await fetch("/api/document-template", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                })
                const json = await res.json()
                if (!res.ok) {
                    throw new Error(json?.error ?? "Failed to clone document template")
                }
                return json as DocumentTemplateDetailResponse
            },
            onSuccess: (response) => {
                upsertDocumentTemplateInCache(queryClient, response.data)
                syncTemplateProgramsInOptionsCache(queryClient, null, response.data)
            },
        })

        const deleteTemplateById = useCallback(
            async (id: string) => {
                setDeletingId(id)
                setDeleteError(null)
                const toastId = toast.loading("Deleting template...")

                try {
                    await deleteMutation.mutateAsync(id)
                    toast.success("Document template deleted successfully.", { id: toastId })
                } catch (error) {
                    const message =
                        error instanceof Error
                            ? error.message
                            : "Failed to delete document template"
                    setDeleteError(message)
                    toast.error(message, { id: toastId })
                    throw error
                } finally {
                    setDeletingId(null)
                }
            },
            [deleteMutation]
        )

        const cloneTemplate = useCallback(
            async (payload: {
                sourceId: string
                title: string
                body_html: string
                locale: TemplateLocale
                template_dates: DocumentTemplateDates
                watermark: DocumentTemplateWatermark
                course_ids: string[]
            }) => {
                setCloningId(payload.sourceId)
                const toastId = toast.loading("Cloning template...")

                try {
                    const response = await cloneMutation.mutateAsync({
                        title: payload.title,
                        body_html: payload.body_html,
                        locale: payload.locale,
                        template_dates: payload.template_dates,
                        watermark: payload.watermark,
                        course_ids: payload.course_ids,
                    })
                    toast.success("Document template cloned successfully.", { id: toastId })
                    return response.data
                } catch (error) {
                    const message =
                        error instanceof Error
                            ? error.message
                            : "Failed to clone document template"
                    toast.error(message, { id: toastId })
                    throw error
                } finally {
                    setCloningId(null)
                }
            },
            [cloneMutation]
        )

        const clearDeleteError = useCallback(() => {
            setDeleteError(null)
        }, [])

        const logicProps: DocumentTemplateListLogicProps = {
            templates,
            canCreateTemplate,
            canDeleteTemplate,
            isLoading: templatesQuery.isLoading,
            isError: templatesQuery.isError,
            errorMessage:
                templatesQuery.error instanceof Error
                    ? templatesQuery.error.message
                    : undefined,
            isDeleting: deleteMutation.isPending,
            deletingId,
            cloningId,
            deleteError,
            deleteTemplateById,
            cloneTemplate,
            clearDeleteError,
            refetchTemplates: templatesQuery.refetch,
        }

        return <Component {...(logicProps as unknown as P)} />
    }
}

/** @deprecated Use DocumentTemplateListLogicProps */
export type DocumentTemplatePageLogicProps = DocumentTemplateListLogicProps
