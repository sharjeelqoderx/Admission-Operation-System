"use client"

import React, { useCallback, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type {
    DocumentTemplateListItem,
    DocumentTemplatesListResponse,
} from "@/types/schemas/document-template"
import { DEFAULT_TEMPLATE_BODY_HTML } from "@/lib/document-template/a4-document"

export type DocumentTemplatePageMode = "list" | "create" | "edit" | "view"

export type DocumentTemplatePageLogicProps = {
    templates: DocumentTemplateListItem[]
    isLoading: boolean
    isError: boolean
    errorMessage?: string
    mode: DocumentTemplatePageMode
    activeTemplate: DocumentTemplateListItem | null
    title: string
    bodyHtml: string
    isSaving: boolean
    isDeleting: boolean
    deletingId: string | null
    formError: string | null
    setTitle: (value: string) => void
    setBodyHtml: (value: string) => void
    openCreate: () => void
    openEdit: (template: DocumentTemplateListItem) => void
    openView: (template: DocumentTemplateListItem) => void
    backToList: () => void
    saveTemplate: () => Promise<void>
    deleteTemplateById: (id: string) => Promise<void>
    refetchTemplates: () => void
}

const EMPTY_TEMPLATE_HTML = DEFAULT_TEMPLATE_BODY_HTML

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
    }: {
        initialTemplates: DocumentTemplateListItem[]
    }) {
        const queryClient = useQueryClient()
        const [mode, setMode] = useState<DocumentTemplatePageMode>("list")
        const [activeTemplate, setActiveTemplate] = useState<DocumentTemplateListItem | null>(null)
        const [title, setTitle] = useState("")
        const [bodyHtml, setBodyHtml] = useState(EMPTY_TEMPLATE_HTML)
        const [formError, setFormError] = useState<string | null>(null)
        const [deletingId, setDeletingId] = useState<string | null>(null)

        const templatesQuery = useQuery({
            queryKey: ["document-templates"],
            queryFn: fetchDocumentTemplates,
            initialData: { data: initialTemplates },
        })

        const templates = useMemo(
            () => templatesQuery.data?.data ?? [],
            [templatesQuery.data?.data]
        )

        const createMutation = useMutation({
            mutationFn: async (payload: { title: string; body_html: string }) => {
                const res = await fetch("/api/document-template", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                })
                const json = await res.json()
                if (!res.ok) {
                    throw new Error(json?.error ?? "Failed to create document template")
                }
                return json
            },
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["document-templates"] })
            },
        })

        const updateMutation = useMutation({
            mutationFn: async ({
                id,
                payload,
            }: {
                id: string
                payload: { title: string; body_html: string }
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
                return json
            },
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["document-templates"] })
            },
        })

        const deleteMutation = useMutation({
            mutationFn: async (id: string) => {
                const res = await fetch(`/api/document-template/${id}`, {
                    method: "DELETE",
                })
                const json = await res.json()
                if (!res.ok) {
                    throw new Error(json?.error ?? "Failed to delete document template")
                }
                return json
            },
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["document-templates"] })
            },
        })

        const resetEditorState = useCallback(() => {
            setTitle("")
            setBodyHtml(EMPTY_TEMPLATE_HTML)
            setFormError(null)
            setActiveTemplate(null)
        }, [])

        const openCreate = useCallback(() => {
            resetEditorState()
            setMode("create")
        }, [resetEditorState])

        const openEdit = useCallback((template: DocumentTemplateListItem) => {
            setActiveTemplate(template)
            setTitle(template.title)
            setBodyHtml(template.body_html || EMPTY_TEMPLATE_HTML)
            setFormError(null)
            setMode("edit")
        }, [])

        const openView = useCallback((template: DocumentTemplateListItem) => {
            setActiveTemplate(template)
            setTitle(template.title)
            setBodyHtml(template.body_html || EMPTY_TEMPLATE_HTML)
            setFormError(null)
            setMode("view")
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

            const payload = {
                title: title.trim(),
                body_html: bodyHtml,
            }

            const toastId = toast.loading(
                mode === "create" ? "Creating template..." : "Updating template..."
            )

            try {
                if (mode === "create") {
                    await createMutation.mutateAsync(payload)
                    toast.success("Document template created successfully.", { id: toastId })
                } else if (mode === "edit" && activeTemplate) {
                    await updateMutation.mutateAsync({
                        id: activeTemplate.id,
                        payload,
                    })
                    toast.success("Document template updated successfully.", { id: toastId })
                }

                backToList()
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : "Failed to save document template"
                setFormError(message)
                toast.error(message, { id: toastId })
            }
        }, [
            activeTemplate,
            backToList,
            bodyHtml,
            createMutation,
            mode,
            title,
            updateMutation,
        ])

        const deleteTemplateById = useCallback(
            async (id: string) => {
                setDeletingId(id)
                const toastId = toast.loading("Deleting template...")

                try {
                    await deleteMutation.mutateAsync(id)
                    toast.success("Document template deleted successfully.", { id: toastId })

                    if (activeTemplate?.id === id) {
                        backToList()
                    }
                } catch (error) {
                    toast.error(
                        error instanceof Error
                            ? error.message
                            : "Failed to delete document template",
                        { id: toastId }
                    )
                    throw error
                } finally {
                    setDeletingId(null)
                }
            },
            [activeTemplate?.id, backToList, deleteMutation]
        )

        const logicProps: DocumentTemplatePageLogicProps = {
            templates,
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
            isSaving: createMutation.isPending || updateMutation.isPending,
            isDeleting: deleteMutation.isPending,
            deletingId,
            formError,
            setTitle,
            setBodyHtml,
            openCreate,
            openEdit,
            openView,
            backToList,
            saveTemplate,
            deleteTemplateById,
            refetchTemplates: templatesQuery.refetch,
        }

        return <Component {...(logicProps as unknown as P)} />
    }
}
