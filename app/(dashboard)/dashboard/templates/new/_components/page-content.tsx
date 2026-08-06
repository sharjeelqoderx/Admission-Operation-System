"use client"

import { memo, useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { DEFAULT_TEMPLATE_BODY_HTML } from "@/lib/document-template/a4-document"
import {
    EMPTY_DOCUMENT_TEMPLATE_DATES,
    type DocumentTemplateDates,
} from "@/lib/document-template/date-variables"
import { DEFAULT_TEMPLATE_LOCALE } from "@/lib/document-template/locale"
import {
    DEFAULT_DOCUMENT_TEMPLATE_WATERMARK,
    type DocumentTemplateWatermark,
} from "@/lib/document-template/watermark"
import {
    claimProgramInOptionsCache,
    upsertDocumentTemplateInCache,
} from "@/lib/document-template/query-cache"
import type {
    DocumentTemplateDetailResponse,
    TemplateLocale,
} from "@/types/schemas/document-template"
import { DocumentTemplateFormView } from "../../_components/document-template-form-view"

export const CreatePageContent = memo(function CreatePageContent() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [title, setTitle] = useState("")
    const [bodyHtml, setBodyHtml] = useState(DEFAULT_TEMPLATE_BODY_HTML)
    const [locale, setLocale] = useState<TemplateLocale>(DEFAULT_TEMPLATE_LOCALE)
    const [templateDates, setTemplateDates] = useState<DocumentTemplateDates>({
        ...EMPTY_DOCUMENT_TEMPLATE_DATES,
    })
    const [watermark, setWatermark] = useState<DocumentTemplateWatermark>({
        ...DEFAULT_DOCUMENT_TEMPLATE_WATERMARK,
    })
    const [programId, setProgramId] = useState<string | null>(null)
    const [formError, setFormError] = useState<string | null>(null)

    const createMutation = useMutation({
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
                throw new Error(json?.error ?? "Failed to create document template")
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

    const handleSave = useCallback(async () => {
        setFormError(null)

        if (!title.trim()) {
            setFormError("Title is required.")
            return
        }

        if (!programId) {
            setFormError("Select a program for this offer template.")
            return
        }

        const toastId = toast.loading("Creating template...")

        try {
            await createMutation.mutateAsync({
                title: title.trim(),
                body_html: bodyHtml,
                locale,
                template_dates: templateDates,
                watermark,
                program_id: programId,
            })
            toast.success("Document template created successfully.", { id: toastId })
            router.push("/dashboard/templates")
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Failed to create document template"
            setFormError(message)
            toast.error(message, { id: toastId })
        }
    }, [bodyHtml, createMutation, locale, programId, router, templateDates, title, watermark])

    return (
        <DocumentTemplateFormView
            heading="Create Document Template"
            backHref="/dashboard/templates"
            title={title}
            bodyHtml={bodyHtml}
            locale={locale}
            templateDates={templateDates}
            watermark={watermark}
            programId={programId}
            isSaving={createMutation.isPending}
            formError={formError}
            onTitleChange={setTitle}
            onBodyChange={setBodyHtml}
            onLocaleChange={setLocale}
            onTemplateDatesChange={setTemplateDates}
            onWatermarkChange={setWatermark}
            onProgramChange={setProgramId}
            onSave={handleSave}
            saveLabel="Create Template"
        />
    )
})
