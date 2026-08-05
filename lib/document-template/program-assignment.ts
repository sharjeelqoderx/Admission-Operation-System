import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { mapTemplateRow } from "@/lib/document-template/server"
import type { DocumentTemplateListItem } from "@/types/schemas/document-template"
import type { DocumentTemplateProgramOption } from "@/types/schemas/document-template"
import type { Database } from "@/types/supabase"

type AppSupabase = SupabaseClient<Database>

function formatProgramLabel(program: {
    name: string | null
    category: string | null
    location: string | null
}) {
    const name = program.name?.trim() || "Untitled program"
    const details = [program.category, program.location].filter(Boolean).join(" • ")
    return details ? `${name} (${details})` : name
}

export async function fetchDocumentTemplateProgramOptions(
    supabase: AppSupabase,
    excludeTemplateId?: string | null
): Promise<DocumentTemplateProgramOption[]> {
    const [{ data: programs, error: programsError }, { data: templates, error: templatesError }] =
        await Promise.all([
            supabase
                .from("program")
                .select("id, name, category, location, status")
                .eq("status", "ACTIVE")
                .order("name", { ascending: true }),
            supabase
                .from("document_template")
                .select("id, program_id, title")
                .eq("is_deleted", false)
                .not("program_id", "is", null),
        ])

    if (programsError) {
        throw new Error(programsError.message)
    }

    if (templatesError) {
        throw new Error(templatesError.message)
    }

    const assignedByProgramId = new Map<string, { template_id: string; template_title: string }>()

    for (const template of templates ?? []) {
        if (!template.program_id) continue
        assignedByProgramId.set(template.program_id, {
            template_id: template.id,
            template_title: template.title,
        })
    }

    return (programs ?? [])
        .map((program) => {
            const assignment = assignedByProgramId.get(program.id)
            const isCurrentTemplate =
                Boolean(excludeTemplateId) && assignment?.template_id === excludeTemplateId

            if (assignment && !isCurrentTemplate) {
                return null
            }

            return {
                id: program.id,
                label: formatProgramLabel(program),
                is_assigned: Boolean(assignment),
                assigned_template_id: assignment?.template_id ?? null,
                assigned_template_title: assignment?.template_title ?? null,
            }
        })
        .filter((option): option is DocumentTemplateProgramOption => option !== null)
}

export async function resolveApplicationProgramId(
    supabase: AppSupabase,
    applicationId: string
): Promise<string | null> {
    const { data, error } = await supabase
        .from("application")
        .select("course:course_id(program_id)")
        .eq("id", applicationId)
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    const course = Array.isArray(data?.course) ? data.course[0] : data?.course
    return course?.program_id ?? null
}

export async function fetchDocumentTemplateForProgramId(
    supabase: AppSupabase,
    programId: string
): Promise<DocumentTemplateListItem | null> {
    const { data, error } = await supabase
        .from("document_template")
        .select("*")
        .eq("program_id", programId)
        .eq("is_deleted", false)
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    return data ? mapTemplateRow(data) : null
}

export async function fetchProgramSummaryById(
    supabase: AppSupabase,
    programId: string
): Promise<{ id: string; label: string } | null> {
    const { data, error } = await supabase
        .from("program")
        .select("id, name, category, location")
        .eq("id", programId)
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    if (!data) return null

    return {
        id: data.id,
        label: formatProgramLabel(data),
    }
}

export async function assertProgramAvailableForTemplate(
    supabase: AppSupabase,
    programId: string,
    templateId?: string | null
) {
    const { data, error } = await supabase
        .from("document_template")
        .select("id, title")
        .eq("program_id", programId)
        .eq("is_deleted", false)
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    if (data && data.id !== templateId) {
        throw new Error(
            `Program is already linked to the "${data.title}" template. Each program can only have one offer template.`
        )
    }
}
