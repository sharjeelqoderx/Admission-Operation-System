import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { mapTemplateRow } from "@/lib/document-template/server"
import type { DocumentTemplateListItem } from "@/types/schemas/document-template"
import type { DocumentTemplateProgramOption } from "@/types/schemas/document-template"
import type { Database } from "@/types/supabase"

type AppSupabase = SupabaseClient<Database>

function formatCourseLabel(course: {
    name: string
    category: string | null
    location: string | null
}) {
    const name = course.name?.trim() || "Untitled program"
    const details = [course.category, course.location].filter(Boolean).join(" • ")
    return details ? `${name} (${details})` : name
}

export async function fetchDocumentTemplateProgramOptions(
    supabase: AppSupabase,
    excludeTemplateId?: string | null
): Promise<DocumentTemplateProgramOption[]> {
    const [{ data: courses, error: coursesError }, { data: templates, error: templatesError }] =
        await Promise.all([
            supabase
                .from("course")
                .select("id, name, category, location, status")
                .eq("is_deleted", false)
                .eq("status", "ACTIVE")
                .order("name", { ascending: true }),
            supabase
                .from("document_template")
                .select("id, course_id, title")
                .eq("is_deleted", false)
                .not("course_id", "is", null),
        ])

    if (coursesError) {
        throw new Error(coursesError.message)
    }

    if (templatesError) {
        throw new Error(templatesError.message)
    }

    const assignedByCourseId = new Map<string, { template_id: string; template_title: string }>()

    for (const template of templates ?? []) {
        if (!template.course_id) continue
        assignedByCourseId.set(template.course_id, {
            template_id: template.id,
            template_title: template.title,
        })
    }

    return (courses ?? [])
        .map((course) => {
            const assignment = assignedByCourseId.get(course.id)
            const isCurrentTemplate =
                Boolean(excludeTemplateId) && assignment?.template_id === excludeTemplateId

            if (assignment && !isCurrentTemplate) {
                return null
            }

            return {
                id: course.id,
                label: formatCourseLabel(course),
                is_assigned: Boolean(assignment),
                assigned_template_id: assignment?.template_id ?? null,
                assigned_template_title: assignment?.template_title ?? null,
            }
        })
        .filter((option): option is DocumentTemplateProgramOption => option !== null)
}

export async function resolveApplicationCourseId(
    supabase: AppSupabase,
    applicationId: string
): Promise<string | null> {
    const { data, error } = await supabase
        .from("application")
        .select("course_id")
        .eq("id", applicationId)
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    return data?.course_id ?? null
}

/** @deprecated Use resolveApplicationCourseId */
export const resolveApplicationProgramId = resolveApplicationCourseId

export async function fetchDocumentTemplateForCourseId(
    supabase: AppSupabase,
    courseId: string
): Promise<DocumentTemplateListItem | null> {
    const { data, error } = await supabase
        .from("document_template")
        .select("*")
        .eq("course_id", courseId)
        .eq("is_deleted", false)
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    return data ? mapTemplateRow(data) : null
}

/** @deprecated Use fetchDocumentTemplateForCourseId */
export const fetchDocumentTemplateForProgramId = fetchDocumentTemplateForCourseId

export async function fetchCourseSummaryById(
    supabase: AppSupabase,
    courseId: string
): Promise<{ id: string; label: string } | null> {
    const { data, error } = await supabase
        .from("course")
        .select("id, name, category, location")
        .eq("id", courseId)
        .eq("is_deleted", false)
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    if (!data) return null

    return {
        id: data.id,
        label: formatCourseLabel(data),
    }
}

/** @deprecated Use fetchCourseSummaryById */
export const fetchProgramSummaryById = fetchCourseSummaryById

export async function assertCourseAvailableForTemplate(
    supabase: AppSupabase,
    courseId: string,
    templateId?: string | null
) {
    const { data, error } = await supabase
        .from("document_template")
        .select("id, title")
        .eq("course_id", courseId)
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

/** @deprecated Use assertCourseAvailableForTemplate */
export const assertProgramAvailableForTemplate = assertCourseAvailableForTemplate
