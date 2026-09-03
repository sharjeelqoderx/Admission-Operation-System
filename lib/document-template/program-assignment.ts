import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { DocumentTemplateProgramOption } from "@/types/schemas/document-template"
import type { Database } from "@/types/supabase"

type AppSupabase = SupabaseClient<Database>

export type CourseSummary = {
    id: string
    name: string
    category: string | null
    location: string | null
}

export function formatCourseLabel(course: {
    name: string
    category: string | null
    location: string | null
}) {
    const name = course.name?.trim() || "Untitled program"
    const details = [course.category, course.location].filter(Boolean).join(" • ")
    return details ? `${name} (${details})` : name
}

export function resolveLinkedCourseIds(input: {
    course_ids?: string[] | null
    program_ids?: string[] | null
    course_id?: string | null
    program_id?: string | null
}): string[] | undefined {
    if (input.course_ids !== undefined || input.program_ids !== undefined) {
        return [
            ...new Set(
                [...(input.course_ids ?? []), ...(input.program_ids ?? [])].filter(
                    (id): id is string => Boolean(id)
                )
            ),
        ]
    }

    if (input.course_id !== undefined || input.program_id !== undefined) {
        const id = input.course_id ?? input.program_id ?? null
        return id ? [id] : []
    }

    return undefined
}

export async function fetchDocumentTemplateProgramOptions(
    supabase: AppSupabase,
    excludeTemplateId?: string | null
): Promise<DocumentTemplateProgramOption[]> {
    const [
        { data: courses, error: coursesError },
        { data: assignments, error: assignmentsError },
        { data: legacyTemplates, error: legacyError },
    ] = await Promise.all([
        supabase
            .from("course")
            .select("id, name, category, location, status")
            .eq("is_deleted", false)
            .eq("status", "ACTIVE")
            .order("name", { ascending: true }),
        supabase.from("document_template_course").select(`
                course_id,
                document_template_id,
                document_template:document_template_id ( id, title, is_deleted )
            `),
        supabase
            .from("document_template")
            .select("id, course_id, title")
            .eq("is_deleted", false)
            .not("course_id", "is", null),
    ])

    if (coursesError) {
        throw new Error(coursesError.message)
    }

    if (assignmentsError) {
        if (!legacyError && legacyTemplates) {
            const assignedByCourseId = new Map<
                string,
                { template_id: string; template_title: string }
            >()

            for (const template of legacyTemplates) {
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
                        Boolean(excludeTemplateId) &&
                        assignment?.template_id === excludeTemplateId

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

        throw new Error(assignmentsError.message)
    }

    if (legacyError) {
        throw new Error(legacyError.message)
    }

    const assignedByCourseId = new Map<string, { template_id: string; template_title: string }>()

    for (const row of assignments ?? []) {
        const templateRelation = Array.isArray(row.document_template)
            ? row.document_template[0]
            : row.document_template

        if (!templateRelation || templateRelation.is_deleted) continue

        assignedByCourseId.set(row.course_id, {
            template_id: templateRelation.id,
            template_title: templateRelation.title,
        })
    }

    for (const template of legacyTemplates ?? []) {
        if (!template.course_id) continue
        if (assignedByCourseId.has(template.course_id)) continue
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

export async function fetchCoursesByIds(
    supabase: AppSupabase,
    courseIds: string[]
): Promise<CourseSummary[]> {
    const uniqueIds = [...new Set(courseIds.filter(Boolean))]
    if (uniqueIds.length === 0) return []

    const { data, error } = await supabase
        .from("course")
        .select("id, name, category, location")
        .in("id", uniqueIds)
        .eq("is_deleted", false)

    if (error) {
        throw new Error(error.message)
    }

    const byId = new Map((data ?? []).map((course) => [course.id, course]))
    return uniqueIds
        .map((id) => byId.get(id))
        .filter((course): course is CourseSummary => Boolean(course))
}

export async function fetchCourseIdsForTemplate(
    supabase: AppSupabase,
    templateId: string,
    legacyCourseId?: string | null
): Promise<string[]> {
    const { data, error } = await supabase
        .from("document_template_course")
        .select("course_id")
        .eq("document_template_id", templateId)

    if (error) {
        if (legacyCourseId) return [legacyCourseId]
        throw new Error(error.message)
    }

    const ids = (data ?? []).map((row) => row.course_id)
    if (ids.length > 0) return ids
    return legacyCourseId ? [legacyCourseId] : []
}

export async function findTemplateIdForCourseId(
    supabase: AppSupabase,
    courseId: string
): Promise<string | null> {
    const { data: junction, error: junctionError } = await supabase
        .from("document_template_course")
        .select("document_template_id")
        .eq("course_id", courseId)
        .maybeSingle()

    if (!junctionError && junction?.document_template_id) {
        const { data, error } = await supabase
            .from("document_template")
            .select("id")
            .eq("id", junction.document_template_id)
            .eq("is_deleted", false)
            .maybeSingle()

        if (error) throw new Error(error.message)
        if (data?.id) return data.id
    }

    const { data, error } = await supabase
        .from("document_template")
        .select("id")
        .eq("course_id", courseId)
        .eq("is_deleted", false)
        .maybeSingle()

    if (error) throw new Error(error.message)
    return data?.id ?? null
}

export async function templateIncludesCourseId(
    supabase: AppSupabase,
    templateId: string,
    courseId: string,
    legacyCourseId?: string | null
): Promise<boolean> {
    const { data, error } = await supabase
        .from("document_template_course")
        .select("course_id")
        .eq("document_template_id", templateId)
        .eq("course_id", courseId)
        .maybeSingle()

    if (!error && data) return true
    return legacyCourseId === courseId
}

export async function fetchCourseSummaryById(
    supabase: AppSupabase,
    courseId: string
): Promise<{ id: string; label: string } | null> {
    const courses = await fetchCoursesByIds(supabase, [courseId])
    const course = courses[0]
    if (!course) return null

    return {
        id: course.id,
        label: formatCourseLabel(course),
    }
}

/** @deprecated Use fetchCourseSummaryById */
export const fetchProgramSummaryById = fetchCourseSummaryById

export async function assertCoursesAvailableForTemplate(
    supabase: AppSupabase,
    courseIds: string[],
    templateId?: string | null
) {
    const uniqueIds = [...new Set(courseIds.filter(Boolean))]
    for (const courseId of uniqueIds) {
        await assertCourseAvailableForTemplate(supabase, courseId, templateId)
    }
}

export async function assertCourseAvailableForTemplate(
    supabase: AppSupabase,
    courseId: string,
    templateId?: string | null
) {
    const { data: junction, error: junctionError } = await supabase
        .from("document_template_course")
        .select(`
            document_template_id,
            document_template:document_template_id ( id, title, is_deleted )
        `)
        .eq("course_id", courseId)
        .maybeSingle()

    if (!junctionError && junction) {
        const templateRelation = Array.isArray(junction.document_template)
            ? junction.document_template[0]
            : junction.document_template

        if (
            templateRelation &&
            !templateRelation.is_deleted &&
            templateRelation.id !== templateId
        ) {
            throw new Error(
                `Program is already linked to the "${templateRelation.title}" template. Each program can only have one offer template.`
            )
        }

        return
    }

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

export async function syncDocumentTemplateCourses(
    supabase: AppSupabase,
    templateId: string,
    courseIds: string[]
) {
    const uniqueIds = [...new Set(courseIds.filter(Boolean))]

    await assertCoursesAvailableForTemplate(supabase, uniqueIds, templateId)

    const { error: deleteError } = await supabase
        .from("document_template_course")
        .delete()
        .eq("document_template_id", templateId)

    if (deleteError) {
        throw new Error(deleteError.message)
    }

    if (uniqueIds.length > 0) {
        const { error: insertError } = await supabase.from("document_template_course").insert(
            uniqueIds.map((courseId) => ({
                document_template_id: templateId,
                course_id: courseId,
            }))
        )

        if (insertError) {
            throw new Error(insertError.message)
        }
    }

    const primaryCourseId = uniqueIds[0] ?? null
    const { error: updateError } = await supabase
        .from("document_template")
        .update({
            course_id: primaryCourseId,
            updated_at: new Date().toISOString(),
        })
        .eq("id", templateId)

    if (updateError) {
        throw new Error(updateError.message)
    }

    return uniqueIds
}
