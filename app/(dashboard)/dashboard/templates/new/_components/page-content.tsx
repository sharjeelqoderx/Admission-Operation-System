"use client"

import { memo, useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { DEFAULT_TEMPLATE_BODY_HTML } from "@/lib/document-template/a4-document"
import { DocumentTemplateFormView } from "../../_components/document-template-form-view"

export const CreatePageContent = memo(function CreatePageContent() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [title, setTitle] = useState("")
    const [bodyHtml, setBodyHtml] = useState(DEFAULT_TEMPLATE_BODY_HTML)
    const [programId, setProgramId] = useState<string | null>(null)
    const [formError, setFormError] = useState<string | null>(null)

    const createMutation = useMutation({
        mutationFn: async (payload: {
            title: string
            body_html: string
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
            return json
        },
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["document-templates"] })
                queryClient.invalidateQueries({ queryKey: ["document-template-program-options"] })
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
                program_id: programId,
            })
            toast.success("Document template created successfully.", { id: toastId })
            router.push("/dashboard/templates")
            router.refresh()
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Failed to create document template"
            setFormError(message)
            toast.error(message, { id: toastId })
        }
    }, [bodyHtml, createMutation, programId, router, title])

    return (
        <DocumentTemplateFormView
            heading="Create Document Template"
            backHref="/dashboard/templates"
            title={title}
            bodyHtml={bodyHtml}
            programId={programId}
            isSaving={createMutation.isPending}
            formError={formError}
            onTitleChange={setTitle}
            onBodyChange={setBodyHtml}
            onProgramChange={setProgramId}
            onSave={handleSave}
            saveLabel="Create Template"
        />
    )
})
