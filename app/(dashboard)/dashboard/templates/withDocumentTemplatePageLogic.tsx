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
import { DEFAULT_TEMPLATE_LOCALE } from "@/lib/document-template/locale"
import { EMPTY_DOCUMENT_TEMPLATE_DATES } from "@/lib/document-template/date-variables"
import type { DocumentTemplateDates } from "@/lib/document-template/date-variables"
import {
    DEFAULT_DOCUMENT_TEMPLATE_WATERMARK,
    type DocumentTemplateWatermark,
} from "@/lib/document-template/watermark"
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
    locale: TemplateLocale
    templateDates: DocumentTemplateDates
    watermark: DocumentTemplateWatermark
    programId: string | null
    isSaving: boolean
    isDeleting: boolean
    deletingId: string | null
    cloningId: string | null
    deleteError: string | null
    formError: string | null
    setTitle: (value: string) => void
    setBodyHtml: (value: string) => void
    setLocale: (value: TemplateLocale) => void
    setTemplateDates: (value: DocumentTemplateDates) => void
    setWatermark: (value: DocumentTemplateWatermark) => void
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
        locale: TemplateLocale
        template_dates: DocumentTemplateDates
        watermark: DocumentTemplateWatermark
        program_id: string
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
        const [locale, setLocale] = useState<TemplateLocale>(DEFAULT_TEMPLATE_LOCALE)
        const [templateDates, setTemplateDates] = useState<DocumentTemplateDates>({
            ...EMPTY_DOCUMENT_TEMPLATE_DATES,
        })
        const [watermark, setWatermark] = useState<DocumentTemplateWatermark>({
            ...DEFAULT_DOCUMENT_TEMPLATE_WATERMARK,
        })
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
                payload: {
                    title: string
                    body_html: string
                    locale?: TemplateLocale
                    template_dates?: DocumentTemplateDates
                    watermark?: DocumentTemplateWatermark
                    program_id?: string | null
                }
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
            mutationFn: async (payload: {
                title: string
                body_html: string
                locale: TemplateLocale
                template_dates: DocumentTemplateDates
                watermark: DocumentTemplateWatermark
                program_id: string
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
            setLocale(DEFAULT_TEMPLATE_LOCALE)
            setTemplateDates({ ...EMPTY_DOCUMENT_TEMPLATE_DATES })
            setWatermark({ ...DEFAULT_DOCUMENT_TEMPLATE_WATERMARK })
            setProgramId(null)
            setFormError(null)
            setActiveTemplate(null)
        }, [])

        const openView = useCallback((template: DocumentTemplateListItem) => {
            setActiveTemplate(template)
            setTitle(template.title)
            setBodyHtml(template.body_html || EMPTY_TEMPLATE_HTML)
            setLocale(template.locale ?? DEFAULT_TEMPLATE_LOCALE)
            setTemplateDates(template.template_dates ?? { ...EMPTY_DOCUMENT_TEMPLATE_DATES })
            setWatermark(template.watermark ?? { ...DEFAULT_DOCUMENT_TEMPLATE_WATERMARK })
            setFormError(null)
            setMode("view")
        }, [])

        const openEdit = useCallback((template: DocumentTemplateListItem) => {
            setActiveTemplate(template)
            setTitle(template.title)
            setBodyHtml(template.body_html || EMPTY_TEMPLATE_HTML)
            setLocale(template.locale ?? DEFAULT_TEMPLATE_LOCALE)
            setTemplateDates(template.template_dates ?? { ...EMPTY_DOCUMENT_TEMPLATE_DATES })
            setWatermark(template.watermark ?? { ...DEFAULT_DOCUMENT_TEMPLATE_WATERMARK })
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
                locale,
                template_dates: templateDates,
                watermark,
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
        }, [activeTemplate, backToList, bodyHtml, locale, programId, templateDates, title, updateMutation, watermark])

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
            async (payload: {
                sourceId: string
                title: string
                body_html: string
                locale: TemplateLocale
                template_dates: DocumentTemplateDates
                watermark: DocumentTemplateWatermark
                program_id: string
            }) => {
                setCloningId(payload.sourceId)
                const toastId = toast.loading("Cloning template...")

                try {
                    await cloneMutation.mutateAsync({
                        title: payload.title,
                        body_html: payload.body_html,
                        locale: payload.locale,
                        template_dates: payload.template_dates,
                        watermark: payload.watermark,
                        program_id: payload.program_id,
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
            locale,
            templateDates,
            watermark,
            programId,
            isSaving: updateMutation.isPending,
            isDeleting: deleteMutation.isPending,
            deletingId,
            cloningId,
            deleteError,
            formError,
            setTitle,
            setBodyHtml,
            setLocale,
            setTemplateDates,
            setWatermark,
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
