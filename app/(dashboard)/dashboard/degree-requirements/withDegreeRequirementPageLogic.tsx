"use client"

import React, { useCallback, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type {
    DegreeRequirementCreateInput,
    DegreeRequirementDetailResponse,
    DegreeRequirementListItem,
    DegreeRequirementListResponse,
    DegreeRequirementOptionsResponse,
    DocumentRequirementType,
} from "@/types/schemas/degree-requirement"

export const DEGREE_REQUIREMENTS_QUERY_KEY = ["degree-requirements"] as const
export const DEGREE_REQUIREMENT_OPTIONS_QUERY_KEY = ["degree-requirement-options"] as const

export type DegreeRequirementPageLogicProps = {
    requirements: DegreeRequirementListItem[]
    isLoading: boolean
    isError: boolean
    errorMessage?: string
    includeDeleted: boolean
    setIncludeDeleted: (value: boolean) => void
    isSaving: boolean
    removingId: string | null
    formError: string | null
    createOpen: boolean
    setCreateOpen: (open: boolean) => void
    editTarget: DegreeRequirementListItem | null
    setEditTarget: (item: DegreeRequirementListItem | null) => void
    removeTarget: DegreeRequirementListItem | null
    setRemoveTarget: (item: DegreeRequirementListItem | null) => void
    createDegreeId: string
    setCreateDegreeId: (value: string) => void
    createDocumentTypeId: string
    setCreateDocumentTypeId: (value: string) => void
    createRequirementType: DocumentRequirementType
    setCreateRequirementType: (value: DocumentRequirementType) => void
    editRequirementType: DocumentRequirementType
    setEditRequirementType: (value: DocumentRequirementType) => void
    degreeOptions: DegreeRequirementOptionsResponse["data"]["degrees"]
    documentTypeOptions: DegreeRequirementOptionsResponse["data"]["document_types"]
    optionsLoading: boolean
    optionsError: string | null
    createRequirement: () => Promise<void>
    updateRequirement: () => Promise<void>
    removeRequirement: () => Promise<void>
    restoreRequirement: (item: DegreeRequirementListItem) => Promise<void>
    refetch: () => void
    clearFormError: () => void
}

async function fetchRequirements(includeDeleted: boolean): Promise<DegreeRequirementListResponse> {
    const params = includeDeleted ? "?include_deleted=true" : ""
    const res = await fetch(`/api/degree-requirement${params}`)
    const json = await res.json()
    if (!res.ok) {
        throw new Error(json?.error ?? "Failed to fetch degree requirements")
    }
    return json
}

async function fetchOptions(): Promise<DegreeRequirementOptionsResponse["data"]> {
    const res = await fetch("/api/degree-requirement/options")
    const json = await res.json()
    if (!res.ok) {
        throw new Error(json?.error ?? "Failed to fetch options")
    }
    return json.data
}

export function withDegreeRequirementPageLogic<P extends DegreeRequirementPageLogicProps>(
    Component: React.ComponentType<P>
) {
    return function DegreeRequirementPageContainer({
        initialRequirements,
    }: {
        initialRequirements?: DegreeRequirementListItem[]
    }) {
        const queryClient = useQueryClient()
        const [includeDeleted, setIncludeDeleted] = useState(false)
        const [formError, setFormError] = useState<string | null>(null)
        const [createOpen, setCreateOpen] = useState(false)
        const [editTarget, setEditTarget] = useState<DegreeRequirementListItem | null>(null)
        const [removeTarget, setRemoveTarget] = useState<DegreeRequirementListItem | null>(null)
        const [createDegreeId, setCreateDegreeId] = useState("")
        const [createDocumentTypeId, setCreateDocumentTypeId] = useState("")
        const [createRequirementType, setCreateRequirementType] =
            useState<DocumentRequirementType>("REQUIRED")
        const [editRequirementType, setEditRequirementType] =
            useState<DocumentRequirementType>("REQUIRED")
        const [removingId, setRemovingId] = useState<string | null>(null)

        const listQuery = useQuery({
            queryKey: [...DEGREE_REQUIREMENTS_QUERY_KEY, includeDeleted ? "all" : "active"],
            queryFn: () => fetchRequirements(includeDeleted),
            initialData: includeDeleted || !initialRequirements
                ? undefined
                : { data: initialRequirements },
            staleTime: Infinity,
            refetchOnWindowFocus: false,
        })

        const optionsQuery = useQuery({
            queryKey: DEGREE_REQUIREMENT_OPTIONS_QUERY_KEY,
            queryFn: fetchOptions,
            staleTime: Infinity,
            refetchOnWindowFocus: false,
        })

        const requirements = useMemo(
            () => listQuery.data?.data ?? [],
            [listQuery.data?.data]
        )

        const upsertInCache = useCallback(
            (item: DegreeRequirementListItem) => {
                queryClient.setQueryData<DegreeRequirementListResponse>(
                    [...DEGREE_REQUIREMENTS_QUERY_KEY, includeDeleted ? "all" : "active"],
                    (current) => {
                        const rows = current?.data ?? []
                        const index = rows.findIndex((row) => row.id === item.id)
                        if (item.is_deleted && !includeDeleted) {
                            return { data: rows.filter((row) => row.id !== item.id) }
                        }
                        if (index === -1) {
                            return { data: [item, ...rows] }
                        }
                        const next = [...rows]
                        next[index] = item
                        return { data: next }
                    }
                )
                queryClient.invalidateQueries({ queryKey: DEGREE_REQUIREMENTS_QUERY_KEY })
            },
            [includeDeleted, queryClient]
        )

        const createMutation = useMutation({
            mutationFn: async (payload: DegreeRequirementCreateInput) => {
                const res = await fetch("/api/degree-requirement", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                })
                const json = await res.json()
                if (!res.ok) {
                    throw new Error(json?.error ?? "Failed to create degree requirement")
                }
                return json as DegreeRequirementDetailResponse
            },
            onSuccess: (response) => {
                upsertInCache(response.data)
            },
        })

        const updateMutation = useMutation({
            mutationFn: async ({
                id,
                payload,
            }: {
                id: string
                payload: { requirement_type?: DocumentRequirementType; is_deleted?: boolean }
            }) => {
                const res = await fetch(`/api/degree-requirement/${id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                })
                const json = await res.json()
                if (!res.ok) {
                    throw new Error(json?.error ?? "Failed to update degree requirement")
                }
                return json as DegreeRequirementDetailResponse
            },
            onSuccess: (response) => {
                upsertInCache(response.data)
            },
        })

        const removeMutation = useMutation({
            mutationFn: async (id: string) => {
                const res = await fetch(`/api/degree-requirement/${id}`, {
                    method: "DELETE",
                })
                const json = await res.json()
                if (!res.ok) {
                    throw new Error(json?.error ?? "Failed to remove degree requirement")
                }
                return json as DegreeRequirementDetailResponse
            },
            onSuccess: (response) => {
                upsertInCache(response.data)
            },
        })

        const resetCreateForm = useCallback(() => {
            setCreateDegreeId("")
            setCreateDocumentTypeId("")
            setCreateRequirementType("REQUIRED")
            setFormError(null)
        }, [])

        const handleSetCreateOpen = useCallback(
            (open: boolean) => {
                setCreateOpen(open)
                if (!open) resetCreateForm()
            },
            [resetCreateForm]
        )

        const handleSetEditTarget = useCallback((item: DegreeRequirementListItem | null) => {
            setEditTarget(item)
            setFormError(null)
            if (item) {
                setEditRequirementType(item.requirement_type)
            }
        }, [])

        const createRequirement = useCallback(async () => {
            setFormError(null)
            if (!createDegreeId) {
                setFormError("Select a degree.")
                return
            }
            if (!createDocumentTypeId) {
                setFormError("Select a document type.")
                return
            }

            const toastId = toast.loading("Creating requirement...")
            try {
                await createMutation.mutateAsync({
                    degree_id: createDegreeId,
                    document_type_id: createDocumentTypeId,
                    requirement_type: createRequirementType,
                })
                toast.success("Degree requirement created.", { id: toastId })
                handleSetCreateOpen(false)
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : "Failed to create degree requirement"
                setFormError(message)
                toast.error(message, { id: toastId })
            }
        }, [
            createDegreeId,
            createDocumentTypeId,
            createMutation,
            createRequirementType,
            handleSetCreateOpen,
        ])

        const updateRequirement = useCallback(async () => {
            if (!editTarget) return
            setFormError(null)
            const toastId = toast.loading("Updating requirement...")
            try {
                await updateMutation.mutateAsync({
                    id: editTarget.id,
                    payload: { requirement_type: editRequirementType },
                })
                toast.success("Degree requirement updated.", { id: toastId })
                handleSetEditTarget(null)
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : "Failed to update degree requirement"
                setFormError(message)
                toast.error(message, { id: toastId })
            }
        }, [editRequirementType, editTarget, handleSetEditTarget, updateMutation])

        const removeRequirement = useCallback(async () => {
            if (!removeTarget) return
            setRemovingId(removeTarget.id)
            const toastId = toast.loading("Removing requirement...")
            try {
                await removeMutation.mutateAsync(removeTarget.id)
                toast.success("Degree requirement removed.", { id: toastId })
                setRemoveTarget(null)
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : "Failed to remove degree requirement"
                toast.error(message, { id: toastId })
            } finally {
                setRemovingId(null)
            }
        }, [removeMutation, removeTarget])

        const restoreRequirement = useCallback(
            async (item: DegreeRequirementListItem) => {
                const toastId = toast.loading("Restoring requirement...")
                try {
                    await updateMutation.mutateAsync({
                        id: item.id,
                        payload: { is_deleted: false },
                    })
                    toast.success("Degree requirement restored.", { id: toastId })
                } catch (error) {
                    const message =
                        error instanceof Error
                            ? error.message
                            : "Failed to restore degree requirement"
                    toast.error(message, { id: toastId })
                }
            },
            [updateMutation]
        )

        const logicProps: DegreeRequirementPageLogicProps = {
            requirements,
            isLoading: listQuery.isLoading,
            isError: listQuery.isError,
            errorMessage:
                listQuery.error instanceof Error ? listQuery.error.message : undefined,
            includeDeleted,
            setIncludeDeleted,
            isSaving: createMutation.isPending || updateMutation.isPending,
            removingId,
            formError,
            createOpen,
            setCreateOpen: handleSetCreateOpen,
            editTarget,
            setEditTarget: handleSetEditTarget,
            removeTarget,
            setRemoveTarget,
            createDegreeId,
            setCreateDegreeId,
            createDocumentTypeId,
            setCreateDocumentTypeId,
            createRequirementType,
            setCreateRequirementType,
            editRequirementType,
            setEditRequirementType,
            degreeOptions: optionsQuery.data?.degrees ?? [],
            documentTypeOptions: optionsQuery.data?.document_types ?? [],
            optionsLoading: optionsQuery.isLoading,
            optionsError:
                optionsQuery.error instanceof Error ? optionsQuery.error.message : null,
            createRequirement,
            updateRequirement,
            removeRequirement,
            restoreRequirement,
            refetch: listQuery.refetch,
            clearFormError: () => setFormError(null),
        }

        return <Component {...(logicProps as unknown as P)} />
    }
}
