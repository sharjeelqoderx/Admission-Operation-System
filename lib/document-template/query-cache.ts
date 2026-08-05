import type { QueryClient } from "@tanstack/react-query"
import type {
    DocumentTemplateListItem,
    DocumentTemplateProgramOption,
    DocumentTemplatesListResponse,
} from "@/types/schemas/document-template"

export const DOCUMENT_TEMPLATES_QUERY_KEY = ["document-templates"] as const
export const DOCUMENT_TEMPLATE_PROGRAM_OPTIONS_QUERY_KEY =
    ["document-template-program-options"] as const

export function upsertDocumentTemplateInCache(
    queryClient: QueryClient,
    template: DocumentTemplateListItem
) {
    queryClient.setQueryData<DocumentTemplatesListResponse>(
        DOCUMENT_TEMPLATES_QUERY_KEY,
        (current) => {
            if (!current?.data) {
                return { data: [template] }
            }

            const index = current.data.findIndex((row) => row.id === template.id)
            if (index === -1) {
                return { data: [template, ...current.data] }
            }

            const next = [...current.data]
            next[index] = template
            return { data: next }
        }
    )
}

export function removeDocumentTemplateFromCache(
    queryClient: QueryClient,
    templateId: string
) {
    queryClient.setQueryData<DocumentTemplatesListResponse>(
        DOCUMENT_TEMPLATES_QUERY_KEY,
        (current) => {
            if (!current?.data) return current
            return {
                data: current.data.filter((row) => row.id !== templateId),
            }
        }
    )
}

function forEachProgramOptionsQuery(
    queryClient: QueryClient,
    updater: (
        queryKey: readonly unknown[],
        excludeTemplateId: string,
        current: DocumentTemplateProgramOption[] | undefined
    ) => DocumentTemplateProgramOption[] | undefined
) {
    const queries = queryClient.getQueryCache().findAll({
        queryKey: DOCUMENT_TEMPLATE_PROGRAM_OPTIONS_QUERY_KEY,
    })

    for (const query of queries) {
        const queryKey = query.queryKey
        const excludeTemplateId =
            typeof queryKey[1] === "string" ? queryKey[1] : "new"
        const current = query.state.data as DocumentTemplateProgramOption[] | undefined
        const next = updater(queryKey, excludeTemplateId, current)
        if (next !== current) {
            queryClient.setQueryData(queryKey, next)
        }
    }
}

export function releaseProgramInOptionsCache(
    queryClient: QueryClient,
    programId: string | null | undefined,
    programLabel: string | null | undefined
) {
    if (!programId) return

    forEachProgramOptionsQuery(queryClient, (_queryKey, _excludeId, current) => {
        if (!current) return current
        if (current.some((option) => option.id === programId)) {
            return current.map((option) =>
                option.id === programId
                    ? {
                          ...option,
                          is_assigned: false,
                          assigned_template_id: null,
                          assigned_template_title: null,
                      }
                    : option
            )
        }

        return [
            ...current,
            {
                id: programId,
                label: programLabel ?? programId,
                is_assigned: false,
                assigned_template_id: null,
                assigned_template_title: null,
            },
        ]
    })
}

/**
 * Hide an assigned program from option lists.
 * Keeps it available for the owning template's edit select (`exclude_template_id`).
 */
export function claimProgramInOptionsCache(
    queryClient: QueryClient,
    programId: string | null | undefined,
    options?: {
        keepForTemplateId?: string | null
        programLabel?: string | null
        templateTitle?: string | null
    }
) {
    if (!programId) return

    const keepForTemplateId = options?.keepForTemplateId ?? null

    forEachProgramOptionsQuery(queryClient, (_queryKey, excludeTemplateId, current) => {
        if (!current) return current

        if (keepForTemplateId && excludeTemplateId === keepForTemplateId) {
            const existing = current.find((option) => option.id === programId)
            if (existing) {
                return current.map((option) =>
                    option.id === programId
                        ? {
                              ...option,
                              is_assigned: true,
                              assigned_template_id: keepForTemplateId,
                              assigned_template_title: options?.templateTitle ?? null,
                          }
                        : option
                )
            }

            return [
                {
                    id: programId,
                    label: options?.programLabel ?? programId,
                    is_assigned: true,
                    assigned_template_id: keepForTemplateId,
                    assigned_template_title: options?.templateTitle ?? null,
                },
                ...current,
            ]
        }

        return current.filter((option) => option.id !== programId)
    })
}
