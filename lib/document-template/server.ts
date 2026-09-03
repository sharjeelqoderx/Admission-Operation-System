import "server-only"

import {
    createSupabaseServerClient,
    tryCreateSupabaseServiceClient,
} from "@/lib/supabase/server"
import { normalizeTemplateLocale } from "@/lib/document-template/locale"
import { parseDocumentTemplateDates } from "@/lib/document-template/date-variables"
import {
    parseDocumentTemplateWatermark,
    type DocumentTemplateWatermark,
} from "@/lib/document-template/watermark"
import {
    fetchCourseIdsForTemplate,
    fetchCoursesByIds,
    findTemplateIdForCourseId,
    formatCourseLabel,
} from "@/lib/document-template/program-assignment"
import { resolveTemplateChecklistItems } from "@/lib/document-template/resolve-checklist-items"
import { extractTemplateVariables } from "@/lib/document-template/variables"
import type { TemplateLocale } from "@/types/schemas/document-template"
import type {
    DocumentTemplateCourseSummary,
    DocumentTemplateListItem,
} from "@/types/schemas/document-template"
import type { Database } from "@/types/supabase"
import { Role } from "@/types/enums/role"

type DocumentTemplateRow = Database["public"]["Tables"]["document_template"]["Row"]

type CourseSummaryRow = Pick<
    Database["public"]["Tables"]["course"]["Row"],
    "id" | "name" | "category" | "location"
>

function toCourseSummaries(
    courses: CourseSummaryRow[] | CourseSummaryRow | null | undefined
): DocumentTemplateCourseSummary[] {
    if (!courses) return []
    const list = Array.isArray(courses) ? courses : [courses]
    return list.map((course) => ({
        id: course.id,
        label: formatCourseLabel(course),
    }))
}

type StaffRole = Role.SUPER_ADMIN | Role.ADMIN | Role.MANAGEMENT | Role.AGENT

const DOCUMENT_TEMPLATE_STAFF_ROLES: StaffRole[] = [
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.MANAGEMENT,
    Role.AGENT,
]

export function isDocumentTemplateStaffRole(
    role: string | null | undefined
): role is StaffRole {
    return role != null && DOCUMENT_TEMPLATE_STAFF_ROLES.includes(role as StaffRole)
}

export function canManageDocumentTemplate(params: {
    role: Database["public"]["Enums"]["role_enum"] | null | undefined
    userId: string
    createdByProfileId: string
}) {
    if (isDocumentTemplateStaffRole(params.role)) {
        return true
    }

    return params.userId === params.createdByProfileId
}

export async function softDeleteDocumentTemplate(id: string) {
    const supabase = await createSupabaseServerClient()

    const { error: rpcError } = await supabase.rpc("soft_delete_document_template", {
        template_id: id,
    })

    if (!rpcError) {
        return { error: null }
    }

    const rpcMessage = rpcError.message ?? ""
    const rpcUnavailable =
        rpcMessage.includes("Could not find the function") ||
        rpcMessage.includes("does not exist") ||
        rpcMessage.includes("schema cache") ||
        rpcMessage.includes('invalid input value for enum role_enum: "UNIVERSITY"')

    if (!rpcUnavailable) {
        return { error: rpcError }
    }

    const updatedAt = new Date().toISOString()
    const payload = { is_deleted: true, course_id: null, updated_at: updatedAt }
    const serviceClient = tryCreateSupabaseServiceClient()

    const runUpdate = async (client: typeof supabase) => {
        await client.from("document_template_course").delete().eq("document_template_id", id)

        const { error } = await client
            .from("document_template")
            .update(payload)
            .eq("id", id)
            .eq("is_deleted", false)

        return { error }
    }

    if (serviceClient) {
        return runUpdate(serviceClient)
    }

    return runUpdate(supabase)
}

function mapTemplateRow(
    row: DocumentTemplateRow,
    courses?: CourseSummaryRow[] | CourseSummaryRow | null
): DocumentTemplateListItem {
    const storedVariables = Array.isArray(row.variables)
        ? row.variables.filter((item): item is string => typeof item === "string")
        : []

    const extractedVariables = extractTemplateVariables(row.body_html)
    const variables = [...new Set([...storedVariables, ...extractedVariables])]

    const checklistItems = resolveTemplateChecklistItems({
        checklistItems: row.checklist_items,
        checklistProfile:
            typeof row.checklist_profile === "string" ? row.checklist_profile : null,
    })

    let courseSummaries = toCourseSummaries(courses)

    if (courseSummaries.length === 0 && row.course_id) {
        courseSummaries = [
            {
                id: row.course_id,
                label: row.course_id,
            },
        ]
    }

    const courseIds = courseSummaries.map((course) => course.id)
    const courseLabel =
        courseSummaries.length === 0
            ? null
            : courseSummaries.map((course) => course.label).join(", ")

    return {
        id: row.id,
        title: row.title,
        body_html: row.body_html,
        locale: normalizeTemplateLocale(row.locale) as TemplateLocale,
        template_dates: parseDocumentTemplateDates(row.template_dates),
        watermark: parseDocumentTemplateWatermark(row.watermark) as DocumentTemplateWatermark,
        variables,
        checklist_items: checklistItems,
        checklist_profile:
            typeof row.checklist_profile === "string" ? row.checklist_profile : null,
        courses: courseSummaries,
        course_ids: courseIds,
        course_id: courseIds[0] ?? row.course_id ?? null,
        course_label: courseLabel,
        program_ids: courseIds,
        program_id: courseIds[0] ?? row.course_id ?? null,
        program_label: courseLabel,
        created_by_profile_id: row.created_by_profile_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
    }
}

export async function fetchDocumentTemplatesForPage(): Promise<DocumentTemplateListItem[]> {
    const supabase = await createSupabaseServerClient()

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
        return []
    }

    const { data, error } = await supabase
        .from("document_template")
        .select("*")
        .eq("is_deleted", false)
        .order("updated_at", { ascending: false })

    if (error) {
        throw new Error(error.message)
    }

    const rows = data ?? []
    if (rows.length === 0) return []

    const templateIds = rows.map((row) => row.id)

    const { data: junctions, error: junctionsError } = await supabase
        .from("document_template_course")
        .select("document_template_id, course_id")
        .in("document_template_id", templateIds)

    const courseIdsByTemplate = new Map<string, string[]>()

    if (!junctionsError) {
        for (const row of junctions ?? []) {
            const current = courseIdsByTemplate.get(row.document_template_id) ?? []
            current.push(row.course_id)
            courseIdsByTemplate.set(row.document_template_id, current)
        }
    }

    for (const row of rows) {
        if (!courseIdsByTemplate.has(row.id) && row.course_id) {
            courseIdsByTemplate.set(row.id, [row.course_id])
        }
    }

    const allCourseIds = [...new Set([...courseIdsByTemplate.values()].flat())]
    const courses = await fetchCoursesByIds(supabase, allCourseIds)
    const courseById = new Map(courses.map((course) => [course.id, course]))

    return rows.map((row) => {
        const ids = courseIdsByTemplate.get(row.id) ?? []
        const linkedCourses = ids
            .map((id) => courseById.get(id))
            .filter((course): course is CourseSummaryRow => Boolean(course))
        return mapTemplateRow(row, linkedCourses)
    })
}

export async function fetchDocumentTemplateById(
    id: string
): Promise<DocumentTemplateListItem | null> {
    const supabase = await createSupabaseServerClient()

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
        return null
    }

    const { data, error } = await supabase
        .from("document_template")
        .select("*")
        .eq("id", id)
        .eq("is_deleted", false)
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    if (!data) return null

    const courseIds = await fetchCourseIdsForTemplate(supabase, data.id, data.course_id)
    const courses = await fetchCoursesByIds(supabase, courseIds)
    return mapTemplateRow(data, courses)
}

export async function loadMappedDocumentTemplate(
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
    templateId: string
): Promise<DocumentTemplateListItem | null> {
    const { data, error } = await supabase
        .from("document_template")
        .select("*")
        .eq("id", templateId)
        .eq("is_deleted", false)
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    if (!data) return null

    const courseIds = await fetchCourseIdsForTemplate(supabase, data.id, data.course_id)
    const courses = await fetchCoursesByIds(supabase, courseIds)
    return mapTemplateRow(data, courses)
}

export async function fetchDocumentTemplateForCourseId(
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
    courseId: string
): Promise<DocumentTemplateListItem | null> {
    const templateId = await findTemplateIdForCourseId(supabase, courseId)
    if (!templateId) return null
    return loadMappedDocumentTemplate(supabase, templateId)
}

/** @deprecated Use fetchDocumentTemplateForCourseId */
export const fetchDocumentTemplateForProgramId = fetchDocumentTemplateForCourseId

export { mapTemplateRow }
