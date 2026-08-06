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
import { resolveTemplateChecklistItems } from "@/lib/document-template/resolve-checklist-items"
import { extractTemplateVariables } from "@/lib/document-template/variables"
import type { TemplateLocale } from "@/types/schemas/document-template"
import type { DocumentTemplateListItem } from "@/types/schemas/document-template"
import type { Database } from "@/types/supabase"
import { Role } from "@/types/enums/role"

type DocumentTemplateRow = Database["public"]["Tables"]["document_template"]["Row"]

type ProgramSummaryRow = Pick<
    Database["public"]["Tables"]["program"]["Row"],
    "id" | "name" | "category" | "location"
>

function formatProgramLabel(program: ProgramSummaryRow | null | undefined): string | null {
    if (!program) return null
    const name = program.name?.trim() || "Untitled program"
    const details = [program.category, program.location].filter(Boolean).join(" • ")
    return details ? `${name} (${details})` : name
}

function pickProgramRelation(
    value: ProgramSummaryRow | ProgramSummaryRow[] | null | undefined
): ProgramSummaryRow | null {
    if (!value) return null
    return Array.isArray(value) ? value[0] ?? null : value
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
    const payload = { is_deleted: true, updated_at: updatedAt }
    const serviceClient = tryCreateSupabaseServiceClient()

    const runUpdate = async (client: typeof supabase) => {
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
    program?: ProgramSummaryRow | null
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
        program_id: row.program_id ?? null,
        program_label: formatProgramLabel(program),
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
        .select(`
            *,
            program:program_id ( id, name, category, location )
        `)
        .eq("is_deleted", false)
        .order("updated_at", { ascending: false })

    if (error) {
        throw new Error(error.message)
    }

    return (data ?? []).map((row) => {
        const { program, ...templateRow } = row as DocumentTemplateRow & {
            program?: ProgramSummaryRow | ProgramSummaryRow[] | null
        }
        return mapTemplateRow(templateRow, pickProgramRelation(program))
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
        .select(`
            *,
            program:program_id ( id, name, category, location )
        `)
        .eq("id", id)
        .eq("is_deleted", false)
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    if (!data) return null

    const { program, ...templateRow } = data as DocumentTemplateRow & {
        program?: ProgramSummaryRow | ProgramSummaryRow[] | null
    }

    return mapTemplateRow(templateRow, pickProgramRelation(program))
}

export { mapTemplateRow }
