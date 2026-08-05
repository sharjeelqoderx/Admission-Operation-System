"use client"

import { useCallback, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { OfferChecklistPreviewResponse } from "@/types/schemas/offer"

type MissingTemplateAlertState = {
    open: boolean
    title: string
    description: string
    allowCreateWithoutTemplate: boolean
}

async function fetchOfferChecklistPreview(
    applicationId: string
): Promise<OfferChecklistPreviewResponse> {
    const res = await fetch(
        `/api/offer/checklist-preview?application_id=${encodeURIComponent(applicationId)}`
    )
    const json = await res.json()
    if (!res.ok) {
        throw new Error(json?.error ?? "Failed to check offer template")
    }
    return json
}

async function createOfferRequest(
    applicationId: string,
    options?: { createWithoutTemplate?: boolean }
) {
    const res = await fetch("/api/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            application_id: applicationId,
            ...(options?.createWithoutTemplate ? { create_without_template: true } : {}),
        }),
    })
    const json = await res.json()
    if (!res.ok) {
        throw new Error(json.details ?? json.error ?? "Failed to create offer")
    }
    return json.data as { id: string }
}

function buildMissingTemplateAlert(params: {
    studentName?: string | null
    programLabel: string | null
    hasProgram: boolean
}): Pick<MissingTemplateAlertState, "title" | "description" | "allowCreateWithoutTemplate"> {
    const studentLabel = params.studentName?.trim() || "this student"

    if (!params.hasProgram) {
        return {
            title: "Program not linked",
            description: `Cannot create an offer for ${studentLabel} because this application's course is not linked to a program yet. Link the course to a program first.`,
            allowCreateWithoutTemplate: false,
        }
    }

    const programLabel = params.programLabel?.trim() || "this program"

    return {
        title: "No template connected",
        description: `No offer template is connected with ${programLabel}. Assign a template to this program from the Templates page, or create the offer without a template.`,
        allowCreateWithoutTemplate: true,
    }
}

type UseCreateOfferActionOptions = {
    applicationId: string
    studentName?: string | null
    onOfferCreated?: (offerId: string) => void
    invalidateQueryKeys?: string[][]
}

export function useCreateOfferAction({
    applicationId,
    studentName,
    onOfferCreated,
    invalidateQueryKeys = [],
}: UseCreateOfferActionOptions) {
    const queryClient = useQueryClient()
    const [missingTemplateAlert, setMissingTemplateAlert] = useState<MissingTemplateAlertState>({
        open: false,
        title: "",
        description: "",
        allowCreateWithoutTemplate: false,
    })

    const invalidateOfferQueries = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ["offers"] })
        queryClient.invalidateQueries({ queryKey: ["applications"] })
        queryClient.invalidateQueries({
            queryKey: ["offer-checklist-preview", applicationId],
        })

        for (const queryKey of invalidateQueryKeys) {
            queryClient.invalidateQueries({ queryKey })
        }
    }, [applicationId, invalidateQueryKeys, queryClient])

    const handleOfferCreated = useCallback(
        (offerId: string) => {
            toast.success("Offer created successfully")
            invalidateOfferQueries()
            onOfferCreated?.(offerId)
        },
        [invalidateOfferQueries, onOfferCreated]
    )

    const createOfferMutation = useMutation({
        mutationFn: async () => {
            const preview = await fetchOfferChecklistPreview(applicationId)

            if (!preview.data.template) {
                return {
                    status: "missing_template" as const,
                    programLabel: preview.data.program_label,
                    hasProgram: preview.data.program_id !== null,
                }
            }

            const offer = await createOfferRequest(applicationId)
            return {
                status: "created" as const,
                offerId: offer.id,
            }
        },
        onSuccess: (result) => {
            if (result.status === "missing_template") {
                const alertContent = buildMissingTemplateAlert({
                    studentName,
                    programLabel: result.programLabel,
                    hasProgram: result.hasProgram,
                })
                setMissingTemplateAlert({
                    open: true,
                    ...alertContent,
                })
                return
            }

            handleOfferCreated(result.offerId)
        },
        onError: (error: Error) => {
            toast.error(error.message)
        },
    })

    const createOfferWithoutTemplateMutation = useMutation({
        mutationFn: () => createOfferRequest(applicationId, { createWithoutTemplate: true }),
        onSuccess: (offer) => {
            setMissingTemplateAlert((current) => ({
                ...current,
                open: false,
            }))
            handleOfferCreated(offer.id)
        },
        onError: (error: Error) => {
            toast.error(error.message)
        },
    })

    const handleCreateOffer = useCallback(() => {
        createOfferMutation.mutate()
    }, [createOfferMutation])

    const closeMissingTemplateAlert = useCallback(() => {
        setMissingTemplateAlert((current) => ({
            ...current,
            open: false,
        }))
    }, [])

    const handleCreateOfferWithoutTemplate = useCallback(() => {
        createOfferWithoutTemplateMutation.mutate()
    }, [createOfferWithoutTemplateMutation])

    return {
        handleCreateOffer,
        handleCreateOfferWithoutTemplate,
        isCreatingOffer:
            createOfferMutation.isPending || createOfferWithoutTemplateMutation.isPending,
        isCreatingOfferWithoutTemplate: createOfferWithoutTemplateMutation.isPending,
        missingTemplateAlert,
        closeMissingTemplateAlert,
    }
}
