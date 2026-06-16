import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { extractTemplateVariables } from "@/lib/document-template/variables"
import type { DocumentTemplateListItem } from "@/types/schemas/document-template"
import type { Database } from "@/types/supabase"

type DocumentTemplateRow = Database["public"]["Tables"]["document_template"]["Row"]

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
