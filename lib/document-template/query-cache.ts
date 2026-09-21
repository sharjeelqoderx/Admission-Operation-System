import type { QueryClient } from "@tanstack/react-query"
import type {
    DocumentTemplateListItem,
    DocumentTemplateProgramOption,
    DocumentTemplatesListResponse,
} from "@/types/schemas/document-template"

export const DOCUMENT_TEMPLATES_QUERY_KEY = ["document-templates"] as const
export const DOCUMENT_TEMPLATE_PROGRAM_OPTIONS_QUERY_KEY =
    ["document-template-program-options"] as const

export function documentTemplateQueryKey(templateId: string) {
    return ["document-template", templateId] as const
}

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

export function releaseProgramsInOptionsCache(
    queryClient: QueryClient,
    programs: Array<{ id: string; label: string | null }>
) {
    for (const program of programs) {
        releaseProgramInOptionsCache(queryClient, program.id, program.label)
    }
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

export function claimProgramsInOptionsCache(
    queryClient: QueryClient,
    programs: Array<{ id: string; label: string | null }>,
    options?: {
        keepForTemplateId?: string | null
        templateTitle?: string | null
    }
) {
    for (const program of programs) {
        claimProgramInOptionsCache(queryClient, program.id, {
            keepForTemplateId: options?.keepForTemplateId,
            programLabel: program.label,
            templateTitle: options?.templateTitle,
        })
    }
}

export function syncTemplateProgramsInOptionsCache(
    queryClient: QueryClient,
    previous: DocumentTemplateListItem | null | undefined,
    next: DocumentTemplateListItem
) {
    const previousIds = new Set(previous?.course_ids?.length ? previous.course_ids : previous?.program_id ? [previous.program_id] : [])
    const nextIds = new Set(next.course_ids ?? [])

    const released = [...previousIds].filter((id) => !nextIds.has(id))
    const claimed = [...nextIds].filter((id) => !previousIds.has(id))

    releaseProgramsInOptionsCache(
        queryClient,
        released.map((id) => ({
            id,
            label:
                previous?.courses?.find((course) => course.id === id)?.label ??
                previous?.program_label ??
                null,
        }))
    )

    claimProgramsInOptionsCache(
        queryClient,
        claimed.map((id) => ({
            id,
            label: next.courses.find((course) => course.id === id)?.label ?? null,
        })),
        {
            keepForTemplateId: next.id,
            templateTitle: next.title,
        }
    )
}
