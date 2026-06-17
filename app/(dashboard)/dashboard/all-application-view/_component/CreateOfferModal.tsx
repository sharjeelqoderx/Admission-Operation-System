"use client"

import { memo, useCallback, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Typography } from "@/components/shared/Typography"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ErrorView } from "@/components/shared/error-view"
import type { DocumentTemplatesListResponse } from "@/types/schemas/document-template"
import { cn } from "@/lib/utils"

async function fetchDocumentTemplates(): Promise<DocumentTemplatesListResponse> {
    const res = await fetch("/api/document-template")
    const json = await res.json()
    if (!res.ok) {
        throw new Error(json?.error ?? "Failed to fetch document templates")
    }
    return json
}

type CreateOfferModalProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    applicationId: string
    studentName?: string | null
    onOfferCreated?: (offerId: string) => void
}

export const CreateOfferModal = memo(function CreateOfferModal({
    open,
    onOpenChange,
    applicationId,
    studentName,
    onOfferCreated,
}: CreateOfferModalProps) {
    const queryClient = useQueryClient()
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

    const {
        data: templatesResponse,
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: ["document-templates"],
        queryFn: fetchDocumentTemplates,
        enabled: open,
    })

    const templates = useMemo(() => {
        const rows = templatesResponse?.data
        return Array.isArray(rows) ? rows : []
    }, [templatesResponse?.data])

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

    const handleCreateOffer = useCallback(() => {
        if (!selectedTemplateId) {
            toast.error("Please select a template first")
            return
        }
        createOfferMutation.mutate(selectedTemplateId)
    }, [createOfferMutation, selectedTemplateId])

    const handleRetry = useCallback(() => {
        refetch()
    }, [refetch])

    const modalDescription = useMemo(() => {
        if (studentName) {
            return `Select an offer template to create an offer for ${studentName}.`
        }
        return "Select an offer template to create an offer for this application."
    }, [studentName])

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Create Offer</DialogTitle>
                    <DialogDescription>{modalDescription}</DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto min-h-0 py-2">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <Loader2 className="size-8 text-brand-secondary animate-spin" />
                            <Typography as="p" className="text-sm font-medium text-gray-500">
                                Loading offer templates...
                            </Typography>
                        </div>
                    ) : isError ? (
                        <div className="space-y-3">
                            <ErrorView
                                message={error instanceof Error ? error.message : "Failed to load templates"}
                            />
                            <Button type="button" variant="outline" onClick={handleRetry}>
                                Retry
                            </Button>
                        </div>
                    ) : templates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                            <FileText className="size-10 text-gray-300" />
                            <Typography as="p" className="text-sm font-medium text-gray-500">
                                No offer templates found.
                            </Typography>
                            <Typography as="p" className="text-xs text-gray-400 max-w-sm">
                                Create templates from the Templates page first, then return here to attach one to this application.
                            </Typography>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {templates.map((template) => {
                                const isSelected = selectedTemplateId === template.id

                                return (
                                    <button
                                        key={template.id}
                                        type="button"
                                        disabled={createOfferMutation.isPending}
                                        onClick={() => setSelectedTemplateId(template.id)}
                                        className={cn(
                                            "w-full text-left rounded-xl border p-4 transition-colors",
                                            "bg-white/50 hover:bg-white/80 border-white/60",
                                            "disabled:opacity-60 disabled:cursor-not-allowed",
                                            isSelected && "border-brand-byzantine bg-brand-byzantine/5 ring-1 ring-brand-byzantine/30"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <Typography as="p" className="text-sm font-bold text-gray-900">
                                                    {template.title}
                                                </Typography>
                                                <Typography as="p" className="text-xs text-gray-500 mt-1">
                                                    Updated {new Date(template.updated_at).toLocaleDateString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    })}
                                                </Typography>
                                                {(template.variables?.length ?? 0) > 0 && (
                                                    <Typography as="p" className="text-[11px] text-gray-400 mt-2 truncate">
                                                        Variables: {(template.variables ?? []).map((v) => `{{${v}}}`).join(", ")}
                                                    </Typography>
                                                )}
                                            </div>
                                            <div
                                                className={cn(
                                                    "size-5 shrink-0 rounded-full border-2 flex items-center justify-center",
                                                    isSelected
                                                        ? "border-brand-byzantine bg-brand-byzantine"
                                                        : "border-gray-300 bg-white"
                                                )}
                                            >
                                                {isSelected ? (
                                                    <div className="size-2 rounded-full bg-white" />
                                                ) : null}
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={createOfferMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleCreateOffer}
                        disabled={!selectedTemplateId || createOfferMutation.isPending || templates.length === 0}
                        className="gap-2"
                    >
                        {createOfferMutation.isPending ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Create Offer"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
})
