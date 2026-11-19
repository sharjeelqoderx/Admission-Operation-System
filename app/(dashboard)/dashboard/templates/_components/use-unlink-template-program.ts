"use client"

import { useCallback, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
    documentTemplateQueryKey,
    releaseProgramInOptionsCache,
    upsertDocumentTemplateInCache,
} from "@/lib/document-template/query-cache"
import type {
    DocumentTemplateCourseSummary,
    DocumentTemplateDetailResponse,
} from "@/types/schemas/document-template"

/**
 * Unlinks one program from a template without deleting the template, so the program
 * can be used by another template right away.
 */
export function useUnlinkTemplateProgram(
    templateId: string,
    onUnlinked?: (program: DocumentTemplateCourseSummary) => void
) {
    const queryClient = useQueryClient()
    const [unlinkingId, setUnlinkingId] = useState<string | null>(null)

    const unlink = useCallback(
        async (program: DocumentTemplateCourseSummary) => {
            const confirmed = window.confirm(
                `Unlink “${program.label}” from this template?\n\nThe template is kept. Offers for this program will have no template until you link it to one again.`
            )
            if (!confirmed) return

            setUnlinkingId(program.id)
            const toastId = toast.loading("Unlinking program…")
            try {
                const res = await fetch(
                    `/api/document-template/${templateId}/programs/${program.id}`,
                    { method: "DELETE" }
                )
                const json = (await res.json()) as DocumentTemplateDetailResponse & { error?: string }
                if (!res.ok) throw new Error(json?.error ?? "Failed to unlink program")

                upsertDocumentTemplateInCache(queryClient, json.data)
                queryClient.setQueryData(documentTemplateQueryKey(templateId), json)
                releaseProgramInOptionsCache(queryClient, program.id, program.label)
                toast.success("Program unlinked", { id: toastId })
                onUnlinked?.(program)
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to unlink program", {
                    id: toastId,
                })
            } finally {
                setUnlinkingId(null)
            }
        },
        [onUnlinked, queryClient, templateId]
    )

    return { unlink, unlinkingId }
}
