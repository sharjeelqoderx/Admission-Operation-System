"use client"

import type { ComponentType } from "react"
import { useCallback, useMemo, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import type {
    UniversityProgramDetail,
    UniversityProgramUpsert,
} from "@/types/schemas/university-program"
import { universityProgramUpsertSchema } from "@/types/schemas/university-program"

const emptyValues: UniversityProgramUpsert = {
    name: "",
    category: "",
    tuition_fees: "",
    agent_commission: null,
    location: "",
    program_length: "",
    study_type: null,
    intake_date: null,
    application_deadline: null,
    level_id: null,
    program_detail: "",
    admission_requirements: "",
    perspectives: "",
    prospects_after_graduation: "",
    competency_model: "",
    professional_skills: "",
    management_skills: "",
    document_type_ids: [],
    document_requirements: [],
}

async function fetchDocumentTypes() {
    const res = await fetch("/api/document-type")
    const json = await res.json()
    if (!res.ok) throw new Error(json?.error ?? "Failed to fetch document types")
    return (json.data ?? []) as { id: string; name: string }[]
}

export type UniversityProgramFormLogicProps = {
    mode: "create" | "edit"
    values: UniversityProgramUpsert
    documentTypes: { id: string; name: string }[]
    selectedDocumentTypeIds: string[]
    documentRequirements: Array<{ document_type_id: string; requirement_type: "REQUIRED" | "OPTIONAL" }>
    isSubmitting: boolean
    errorMessage: string | null
    onChange: <K extends keyof UniversityProgramUpsert>(key: K, value: UniversityProgramUpsert[K]) => void
    onToggleDocumentType: (documentTypeId: string) => void
    onSubmit: () => void
}

export function withUniversityProgramFormLogic(Component: ComponentType<UniversityProgramFormLogicProps>) {
    return function UniversityProgramFormContainer({
        mode,
        courseId,
        initialDetail,
    }: {
        mode: "create" | "edit"
        courseId?: string
        initialDetail?: UniversityProgramDetail
    }) {
        const router = useRouter()
        const [values, setValues] = useState<UniversityProgramUpsert>(
            initialDetail
                ? {
                      name: initialDetail.name,
                      category: initialDetail.category ?? "",
                      tuition_fees: initialDetail.tuition_fees ?? "",
                      agent_commission: initialDetail.agent_commission,
                      location: initialDetail.location ?? "",
                      program_length: initialDetail.program_length ?? "",
                      study_type: initialDetail.study_type,
                      intake_date: initialDetail.intake_date,
                      application_deadline: initialDetail.application_deadline,
                      level_id: initialDetail.level_id ?? null,
                      program_detail: initialDetail.program_detail ?? "",
                      admission_requirements: initialDetail.admission_requirements ?? "",
                      perspectives: initialDetail.perspectives ?? "",
                      prospects_after_graduation: initialDetail.prospects_after_graduation ?? "",
                      competency_model: initialDetail.competency_model ?? "",
                      professional_skills: initialDetail.professional_skills ?? "",
                      management_skills: initialDetail.management_skills ?? "",
                      document_type_ids: initialDetail.document_type_ids ?? [],
                      document_requirements:
                          initialDetail.document_requirements?.map((req) => ({
                              document_type_id: req.document_type_id,
                              requirement_type: req.requirement_type,
                          })) ?? [],
                  }
                : emptyValues
        )
        const [errorMessage, setErrorMessage] = useState<string | null>(null)

        const documentTypesQuery = useQuery({
            queryKey: ["document-types"],
            queryFn: fetchDocumentTypes,
        })

        const saveMutation = useMutation({
            mutationFn: async (payload: UniversityProgramUpsert) => {
                const url =
                    mode === "edit" && courseId
                        ? `/api/university/programs/${courseId}`
                        : "/api/university/programs"

                const res = await fetch(url, {
                    method: mode === "edit" ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                })

                const json = await res.json()
                if (!res.ok) {
                    throw new Error(json?.error ?? "Failed to save program")
                }

                return json.data as { courseId: string }
            },
            onSuccess: (data) => {
                router.push(
                    mode === "create" ? "/dashboard/program" : `/dashboard/program/${data.courseId}/edit`
                )
                router.refresh()
            },
            onError: (error: Error) => {
                setErrorMessage(error.message)
            },
        })

        const onChange = useCallback(
            <K extends keyof UniversityProgramUpsert>(key: K, value: UniversityProgramUpsert[K]) => {
                setValues((current) => ({ ...current, [key]: value }))
                setErrorMessage(null)
            },
            []
        )

        const documentTypes = documentTypesQuery.data ?? []

        // All document types are included; default OPTIONAL unless marked REQUIRED.
        const documentRequirements = useMemo(() => {
            const byId = new Map(
                (values.document_requirements ?? []).map((req) => [req.document_type_id, req])
            )

            return documentTypes.map((documentType) => ({
                document_type_id: documentType.id,
                requirement_type:
                    byId.get(documentType.id)?.requirement_type === "REQUIRED"
                        ? ("REQUIRED" as const)
                        : ("OPTIONAL" as const),
            }))
        }, [documentTypes, values.document_requirements])

        const selectedDocumentTypeIds = useMemo(
            () => documentTypes.map((documentType) => documentType.id),
            [documentTypes]
        )

        const onToggleDocumentType = useCallback(
            (documentTypeId: string) => {
                setValues((current) => {
                    const types = documentTypesQuery.data ?? []
                    const requiredIds = new Set(
                        (current.document_requirements ?? [])
                            .filter((req) => req.requirement_type === "REQUIRED")
                            .map((req) => req.document_type_id)
                    )

                    if (requiredIds.has(documentTypeId)) {
                        requiredIds.delete(documentTypeId)
                    } else {
                        requiredIds.add(documentTypeId)
                    }

                    return {
                        ...current,
                        document_type_ids: types.map((type) => type.id),
                        document_requirements: types.map((type) => ({
                            document_type_id: type.id,
                            requirement_type: requiredIds.has(type.id)
                                ? ("REQUIRED" as const)
                                : ("OPTIONAL" as const),
                        })),
                    }
                })
                setErrorMessage(null)
            },
            [documentTypesQuery.data]
        )

        const onSubmit = useCallback(() => {
            const parsed = universityProgramUpsertSchema.safeParse({
                ...values,
                document_type_ids: selectedDocumentTypeIds,
                document_requirements: documentRequirements,
            })

            if (!parsed.success) {
                setErrorMessage(parsed.error.issues[0]?.message ?? "Invalid program details")
                return
            }

            setErrorMessage(null)
            saveMutation.mutate(parsed.data)
        }, [documentRequirements, saveMutation, selectedDocumentTypeIds, values])

        return (
            <Component
                mode={mode}
                values={values}
                documentTypes={documentTypes}
                selectedDocumentTypeIds={selectedDocumentTypeIds}
                documentRequirements={documentRequirements}
                isSubmitting={saveMutation.isPending}
                errorMessage={errorMessage}
                onChange={onChange}
                onToggleDocumentType={onToggleDocumentType}
                onSubmit={onSubmit}
            />
        )
    }
}
