import "server-only"

import {
    createSupabaseServerClient,
    tryCreateSupabaseServiceClient,
} from "@/lib/supabase/server"
import { extractTemplateVariables } from "@/lib/document-template/variables"
import type { DocumentTemplateListItem } from "@/types/schemas/document-template"
import type { Database } from "@/types/supabase"

type DocumentTemplateRow = Database["public"]["Tables"]["document_template"]["Row"]
type StaffRole = Extract<
    Database["public"]["Enums"]["role_enum"],
    "ADMIN" | "UNIVERSITY" | "AGENT"
>

const DOCUMENT_TEMPLATE_STAFF_ROLES: StaffRole[] = ["ADMIN", "UNIVERSITY", "AGENT"]

export function isDocumentTemplateStaffRole(
    role: Database["public"]["Enums"]["role_enum"] | null | undefined
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
        rpcMessage.includes("schema cache")

    if (!rpcUnavailable) {
        return { error: rpcError }
    }

    const updatedAt = new Date().toISOString()
    const payload = { is_deleted: true, updated_at: updatedAt }
    const serviceClient = tryCreateSupabaseServiceClient()

    if (serviceClient) {
        return serviceClient
            .from("document_template")
            .update(payload)
            .eq("id", id)
            .eq("is_deleted", false)
    }

    return supabase
        .from("document_template")
        .update(payload)
        .eq("id", id)
        .eq("is_deleted", false)
}

function mapTemplateRow(row: DocumentTemplateRow): DocumentTemplateListItem {
    const storedVariables = Array.isArray(row.variables)
        ? row.variables.filter((item): item is string => typeof item === "string")
        : []

    const extractedVariables = extractTemplateVariables(row.body_html)
    const variables = [...new Set([...storedVariables, ...extractedVariables])]

    return {
        id: row.id,
        title: row.title,
        body_html: row.body_html,
        variables,
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

    return (data ?? []).map(mapTemplateRow)
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

    return data ? mapTemplateRow(data) : null
}

export { mapTemplateRow }
