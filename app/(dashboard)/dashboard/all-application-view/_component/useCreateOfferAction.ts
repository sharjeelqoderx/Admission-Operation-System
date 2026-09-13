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
    applicationId: string | null
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

type CreateOfferTarget = {
    applicationId: string
    studentName?: string | null
}

type UseCreateOfferActionOptions = {
    applicationId?: string
    studentName?: string | null
    onOfferCreated?: (offerId: string, applicationId: string) => void
    invalidateQueryKeys?: string[][]
}

export function useCreateOfferAction({
    applicationId,
    studentName,
    onOfferCreated,
    invalidateQueryKeys = [],
}: UseCreateOfferActionOptions = {}) {
    const queryClient = useQueryClient()
    const [pendingApplicationId, setPendingApplicationId] = useState<string | null>(null)
    const [missingTemplateAlert, setMissingTemplateAlert] = useState<MissingTemplateAlertState>({
        open: false,
        title: "",
        description: "",
        allowCreateWithoutTemplate: false,
        applicationId: null,
    })

    const invalidateOfferQueries = useCallback(
        (targetApplicationId: string) => {
            queryClient.invalidateQueries({ queryKey: ["offers"] })
            queryClient.invalidateQueries({ queryKey: ["applications"] })
            queryClient.invalidateQueries({ queryKey: ["university-applications"] })
            queryClient.invalidateQueries({
                queryKey: ["offer-checklist-preview", targetApplicationId],
            })

            for (const queryKey of invalidateQueryKeys) {
                queryClient.invalidateQueries({ queryKey })
            }
        },
        [invalidateQueryKeys, queryClient]
    )

    const handleOfferCreated = useCallback(
        (offerId: string, targetApplicationId: string) => {
            toast.success("Offer created successfully")
            invalidateOfferQueries(targetApplicationId)
            onOfferCreated?.(offerId, targetApplicationId)
        },
        [invalidateOfferQueries, onOfferCreated]
    )

    const createOfferMutation = useMutation({
        mutationFn: async (target: CreateOfferTarget) => {
            const preview = await fetchOfferChecklistPreview(target.applicationId)

            if (!preview.data.template) {
                return {
                    status: "missing_template" as const,
                    applicationId: target.applicationId,
                    studentName: target.studentName,
                    programLabel: preview.data.program_label,
                    hasProgram: preview.data.program_id !== null,
                }
            }

            const offer = await createOfferRequest(target.applicationId)
            return {
                status: "created" as const,
                offerId: offer.id,
                applicationId: target.applicationId,
            }
        },
        onMutate: (target) => {
            setPendingApplicationId(target.applicationId)
        },
        onSuccess: (result) => {
            if (result.status === "missing_template") {
                const alertContent = buildMissingTemplateAlert({
                    studentName: result.studentName,
                    programLabel: result.programLabel,
                    hasProgram: result.hasProgram,
                })
                setMissingTemplateAlert({
                    open: true,
                    applicationId: result.applicationId,
                    ...alertContent,
                })
                return
            }

            handleOfferCreated(result.offerId, result.applicationId)
        },
        onError: (error: Error) => {
            toast.error(error.message)
        },
        onSettled: () => {
            setPendingApplicationId(null)
        },
    })

    const createOfferWithoutTemplateMutation = useMutation({
        mutationFn: (targetApplicationId: string) =>
            createOfferRequest(targetApplicationId, { createWithoutTemplate: true }),
        onMutate: (targetApplicationId) => {
            setPendingApplicationId(targetApplicationId)
        },
        onSuccess: (offer, targetApplicationId) => {
            setMissingTemplateAlert((current) => ({
                ...current,
                open: false,
                applicationId: null,
            }))
            handleOfferCreated(offer.id, targetApplicationId)
        },
        onError: (error: Error) => {
            toast.error(error.message)
        },
        onSettled: () => {
            setPendingApplicationId(null)
        },
    })

    const resolveTarget = useCallback(
        (override?: Partial<CreateOfferTarget>): CreateOfferTarget | null => {
            const nextApplicationId = override?.applicationId ?? applicationId
            if (!nextApplicationId) return null

            return {
                applicationId: nextApplicationId,
                studentName: override?.studentName ?? studentName,
            }
        },
        [applicationId, studentName]
    )

    const handleCreateOffer = useCallback(
        (override?: Partial<CreateOfferTarget>) => {
            const target = resolveTarget(override)
            if (!target) return
            createOfferMutation.mutate(target)
        },
        [createOfferMutation, resolveTarget]
    )

    const closeMissingTemplateAlert = useCallback(() => {
        setMissingTemplateAlert((current) => ({
            ...current,
            open: false,
            applicationId: null,
        }))
    }, [])

    const handleCreateOfferWithoutTemplate = useCallback(() => {
        const targetApplicationId =
            missingTemplateAlert.applicationId ?? applicationId ?? null
        if (!targetApplicationId) return
        createOfferWithoutTemplateMutation.mutate(targetApplicationId)
    }, [
        applicationId,
        createOfferWithoutTemplateMutation,
        missingTemplateAlert.applicationId,
    ])

    return {
        handleCreateOffer,
        handleCreateOfferWithoutTemplate,
        isCreatingOffer:
            createOfferMutation.isPending || createOfferWithoutTemplateMutation.isPending,
        isCreatingOfferWithoutTemplate: createOfferWithoutTemplateMutation.isPending,
        pendingApplicationId,
        missingTemplateAlert,
        closeMissingTemplateAlert,
    }
}
