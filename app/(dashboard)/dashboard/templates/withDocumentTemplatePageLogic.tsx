"use client"

import React, { useCallback, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type {
    DocumentTemplateDetailResponse,
    DocumentTemplateListItem,
    DocumentTemplatesListResponse,
} from "@/types/schemas/document-template"
import { DEFAULT_TEMPLATE_BODY_HTML } from "@/lib/document-template/a4-document"
import {
    claimProgramInOptionsCache,
    DOCUMENT_TEMPLATES_QUERY_KEY,
    releaseProgramInOptionsCache,
    removeDocumentTemplateFromCache,
    upsertDocumentTemplateInCache,
} from "@/lib/document-template/query-cache"

export type DocumentTemplatePageMode = "list" | "edit" | "view"

export type DocumentTemplatePageLogicProps = {
    templates: DocumentTemplateListItem[]
    canCreateTemplate: boolean
    canDeleteTemplate: boolean
    isLoading: boolean
    isError: boolean
    errorMessage?: string
    mode: DocumentTemplatePageMode
    activeTemplate: DocumentTemplateListItem | null
    title: string
    bodyHtml: string
    programId: string | null
    isSaving: boolean
    isDeleting: boolean
    deletingId: string | null
    cloningId: string | null
    deleteError: string | null
    formError: string | null
    setTitle: (value: string) => void
    setBodyHtml: (value: string) => void
    setProgramId: (value: string | null) => void
    openEdit: (template: DocumentTemplateListItem) => void
    openView: (template: DocumentTemplateListItem) => void
    backToList: () => void
    saveTemplate: () => Promise<void>
    deleteTemplateById: (id: string) => Promise<void>
    cloneTemplate: (payload: {
        sourceId: string
        title: string
        body_html: string
    }) => Promise<void>
    clearDeleteError: () => void
    refetchTemplates: () => void
}

const EMPTY_TEMPLATE_HTML = DEFAULT_TEMPLATE_BODY_HTML

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

export function withDocumentTemplatePageLogic<P extends DocumentTemplatePageLogicProps>(
    Component: React.ComponentType<P>
) {
    return function DocumentTemplatePageContainer({
        initialTemplates,
        canCreateTemplate,
        canDeleteTemplate,
    }: {
        initialTemplates: DocumentTemplateListItem[]
        canCreateTemplate: boolean
        canDeleteTemplate: boolean
    }) {
        const queryClient = useQueryClient()
        const [mode, setMode] = useState<DocumentTemplatePageMode>("list")
        const [activeTemplate, setActiveTemplate] = useState<DocumentTemplateListItem | null>(null)
        const [title, setTitle] = useState("")
        const [bodyHtml, setBodyHtml] = useState(EMPTY_TEMPLATE_HTML)
        const [programId, setProgramId] = useState<string | null>(null)
        const [formError, setFormError] = useState<string | null>(null)
        const [deleteError, setDeleteError] = useState<string | null>(null)
        const [deletingId, setDeletingId] = useState<string | null>(null)
        const [cloningId, setCloningId] = useState<string | null>(null)

        const templatesQuery = useQuery({
            queryKey: DOCUMENT_TEMPLATES_QUERY_KEY,
            queryFn: fetchDocumentTemplates,
            initialData: { data: initialTemplates },
            staleTime: Infinity,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
        })

        const templates = useMemo(
            () => templatesQuery.data?.data ?? [],
            [templatesQuery.data?.data]
        )

        const updateMutation = useMutation({
            mutationFn: async ({
                id,
                payload,
            }: {
                id: string
                payload: { title: string; body_html: string; program_id?: string | null }
            }) => {
                const res = await fetch(`/api/document-template/${id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                })
                const json = await res.json()
                if (!res.ok) {
                    throw new Error(json?.error ?? "Failed to update document template")
                }
                return json as DocumentTemplateDetailResponse
            },
            onSuccess: (response, variables) => {
                const cached = queryClient.getQueryData<DocumentTemplatesListResponse>(
                    DOCUMENT_TEMPLATES_QUERY_KEY
                )
                const previous = cached?.data.find((row) => row.id === variables.id)
                const updated = response.data

                upsertDocumentTemplateInCache(queryClient, updated)

                if (previous?.program_id !== updated.program_id) {
                    releaseProgramInOptionsCache(
                        queryClient,
                        previous?.program_id,
                        previous?.program_label
                    )
                    claimProgramInOptionsCache(queryClient, updated.program_id, {
                        keepForTemplateId: updated.id,
                        programLabel: updated.program_label,
                        templateTitle: updated.title,
                    })
                }
            },
        })

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
                releaseProgramInOptionsCache(
                    queryClient,
                    previous?.program_id,
                    previous?.program_label
                )
            },
        })

        const cloneMutation = useMutation({
            mutationFn: async (payload: { title: string; body_html: string }) => {
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
                claimProgramInOptionsCache(queryClient, response.data.program_id, {
                    keepForTemplateId: response.data.id,
                    programLabel: response.data.program_label,
                    templateTitle: response.data.title,
                })
            },
        })

        const resetEditorState = useCallback(() => {
            setTitle("")
            setBodyHtml(EMPTY_TEMPLATE_HTML)
            setProgramId(null)
            setFormError(null)
            setActiveTemplate(null)
        }, [])

        const openView = useCallback((template: DocumentTemplateListItem) => {
            setActiveTemplate(template)
            setTitle(template.title)
            setBodyHtml(template.body_html || EMPTY_TEMPLATE_HTML)
            setFormError(null)
            setMode("view")
        }, [])

        const openEdit = useCallback((template: DocumentTemplateListItem) => {
            setActiveTemplate(template)
            setTitle(template.title)
            setBodyHtml(template.body_html || EMPTY_TEMPLATE_HTML)
            setProgramId(template.program_id ?? null)
            setFormError(null)
            setMode("edit")
        }, [])

        const backToList = useCallback(() => {
            resetEditorState()
            setMode("list")
        }, [resetEditorState])

        const saveTemplate = useCallback(async () => {
            setFormError(null)

            if (!title.trim()) {
                setFormError("Title is required.")
                return
            }

            if (!activeTemplate) {
                setFormError("No template selected.")
                return
            }

            if (!programId) {
                setFormError("Select a program for this offer template.")
                return
            }

            const payload = {
                title: title.trim(),
                body_html: bodyHtml,
                program_id: programId,
            }

            const toastId = toast.loading("Updating template...")

            try {
                await updateMutation.mutateAsync({
                    id: activeTemplate.id,
                    payload,
                })
                toast.success("Document template updated successfully.", { id: toastId })
                backToList()
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : "Failed to save document template"
                setFormError(message)
                toast.error(message, { id: toastId })
            }
        }, [activeTemplate, backToList, bodyHtml, programId, title, updateMutation])

        const deleteTemplateById = useCallback(
            async (id: string) => {
                setDeletingId(id)
                setDeleteError(null)
                const toastId = toast.loading("Deleting template...")

                try {
                    await deleteMutation.mutateAsync(id)
                    toast.success("Document template deleted successfully.", { id: toastId })

                    if (activeTemplate?.id === id) {
                        backToList()
                    }
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
            [activeTemplate?.id, backToList, deleteMutation]
        )

        const cloneTemplate = useCallback(
            async (payload: { sourceId: string; title: string; body_html: string }) => {
                setCloningId(payload.sourceId)
                const toastId = toast.loading("Cloning template...")

                try {
                    await cloneMutation.mutateAsync({
                        title: payload.title,
                        body_html: payload.body_html,
                    })
                    toast.success("Document template cloned successfully.", { id: toastId })
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

        const logicProps: DocumentTemplatePageLogicProps = {
            templates,
            canCreateTemplate,
            canDeleteTemplate,
            isLoading: templatesQuery.isLoading,
            isError: templatesQuery.isError,
            errorMessage:
                templatesQuery.error instanceof Error
                    ? templatesQuery.error.message
                    : undefined,
            mode,
            activeTemplate,
            title,
            bodyHtml,
            programId,
            isSaving: updateMutation.isPending,
            isDeleting: deleteMutation.isPending,
            deletingId,
            cloningId,
            deleteError,
            formError,
            setTitle,
            setBodyHtml,
            setProgramId,
            openEdit,
            openView,
            backToList,
            saveTemplate,
            deleteTemplateById,
            cloneTemplate,
            clearDeleteError,
            refetchTemplates: templatesQuery.refetch,
        }

        return <Component {...(logicProps as unknown as P)} />
    }
}
