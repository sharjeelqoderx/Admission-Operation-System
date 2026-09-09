import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { isUniversityStaffRole } from "@/lib/auth/university-role"
import type {
    DegreeRequirementCreateInput,
    DegreeRequirementListItem,
    DegreeRequirementUpdateInput,
    DocumentRequirementType,
} from "@/types/schemas/degree-requirement"
import type { Database } from "@/types/supabase"

type DegreeRequirementRow = Database["public"]["Tables"]["degree_requirement"]["Row"]

type DegreeRelation = {
    id: string
    name: string
    location: string | null
} | null

type DocumentTypeRelation = {
    id: string
    name: string
    code: string | null
} | null

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
    if (!value) return null
    return Array.isArray(value) ? value[0] ?? null : value
}

function mapRequirementRow(
    row: DegreeRequirementRow & {
        degree?: DegreeRelation | DegreeRelation[] | null
        document_type?: DocumentTypeRelation | DocumentTypeRelation[] | null
    }
): DegreeRequirementListItem {
    const degree = unwrapRelation(row.degree)
    const documentType = unwrapRelation(row.document_type)

    return {
        id: row.id,
        degree_id: row.degree_id,
        degree_name: degree?.name?.trim() || "Untitled degree",
        degree_location: degree?.location ?? null,
        document_type_id: row.document_type_id,
        document_type_name: documentType?.name?.trim() || "Document",
        document_type_code: documentType?.code ?? null,
        requirement_type: row.requirement_type as DocumentRequirementType,
        is_deleted: row.is_deleted,
        created_at: row.created_at,
        updated_at: row.updated_at,
    }
}

const REQUIREMENT_SELECT = `
    id,
    degree_id,
    document_type_id,
    requirement_type,
    is_deleted,
    created_at,
    updated_at,
    degree:degree_id ( id, name, location ),
    document_type:document_type_id ( id, name, code )
` as const

export function canManageDegreeRequirements(role: string | null | undefined) {
    return isUniversityStaffRole(role)
}

export async function fetchDegreeRequirements(options?: {
    includeDeleted?: boolean
}): Promise<DegreeRequirementListItem[]> {
    const supabase = await createSupabaseServerClient()
    let query = supabase
        .from("degree_requirement")
        .select(REQUIREMENT_SELECT)
        .order("updated_at", { ascending: false })

    if (!options?.includeDeleted) {
        query = query.eq("is_deleted", false)
    }

    const { data, error } = await query

    if (error) {
        throw new Error(error.message)
    }

    return (data ?? []).map((row) =>
        mapRequirementRow(
            row as DegreeRequirementRow & {
                degree?: DegreeRelation | DegreeRelation[] | null
                document_type?: DocumentTypeRelation | DocumentTypeRelation[] | null
            }
        )
    )
}

export async function fetchDegreeRequirementById(
    id: string
): Promise<DegreeRequirementListItem | null> {
    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase
        .from("degree_requirement")
        .select(REQUIREMENT_SELECT)
        .eq("id", id)
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    if (!data) return null

    return mapRequirementRow(
        data as DegreeRequirementRow & {
            degree?: DegreeRelation | DegreeRelation[] | null
            document_type?: DocumentTypeRelation | DocumentTypeRelation[] | null
        }
    )
}

export async function fetchDegreeRequirementOptions() {
    const supabase = await createSupabaseServerClient()

    const [{ data: degrees, error: degreesError }, { data: documentTypes, error: typesError }] =
        await Promise.all([
            supabase
                .from("degree")
                .select("id, name, location")
                .order("name", { ascending: true }),
            supabase
                .from("document_type")
                .select("id, name, code, is_active")
                .eq("is_active", true)
                .order("name", { ascending: true }),
        ])

    if (degreesError) throw new Error(degreesError.message)
    if (typesError) throw new Error(typesError.message)

    return {
        degrees: (degrees ?? []).map((degree) => ({
            id: degree.id,
            label: [degree.name?.trim() || "Untitled degree", degree.location]
                .filter(Boolean)
                .join(" • "),
        })),
        document_types: (documentTypes ?? []).map((docType) => ({
            id: docType.id,
            label: docType.name?.trim() || "Document",
            code: docType.code ?? null,
        })),
    }
}

export async function createDegreeRequirement(input: DegreeRequirementCreateInput) {
    const supabase = await createSupabaseServerClient()

    const { data: existing, error: existingError } = await supabase
        .from("degree_requirement")
        .select("id, is_deleted")
        .eq("degree_id", input.degree_id)
        .eq("document_type_id", input.document_type_id)
        .maybeSingle()

    if (existingError) {
        throw new Error(existingError.message)
    }

    if (existing && !existing.is_deleted) {
        throw new Error("This document is already assigned to the selected degree.")
    }

    if (existing?.is_deleted) {
        const { data, error } = await supabase
            .from("degree_requirement")
            .update({
                is_deleted: false,
                requirement_type: input.requirement_type,
                updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id)
            .select(REQUIREMENT_SELECT)
            .single()

        if (error || !data) {
            throw new Error(error?.message ?? "Failed to restore degree requirement")
        }

        return mapRequirementRow(
            data as DegreeRequirementRow & {
                degree?: DegreeRelation | DegreeRelation[] | null
                document_type?: DocumentTypeRelation | DocumentTypeRelation[] | null
            }
        )
    }

    const { data, error } = await supabase
        .from("degree_requirement")
        .insert({
            degree_id: input.degree_id,
            document_type_id: input.document_type_id,
            requirement_type: input.requirement_type,
            is_deleted: false,
        })
        .select(REQUIREMENT_SELECT)
        .single()

    if (error || !data) {
        throw new Error(error?.message ?? "Failed to create degree requirement")
    }

    return mapRequirementRow(
        data as DegreeRequirementRow & {
            degree?: DegreeRelation | DegreeRelation[] | null
            document_type?: DocumentTypeRelation | DocumentTypeRelation[] | null
        }
    )
}

export async function updateDegreeRequirement(
    id: string,
    input: DegreeRequirementUpdateInput
) {
    const supabase = await createSupabaseServerClient()

    const payload: Database["public"]["Tables"]["degree_requirement"]["Update"] = {
        updated_at: new Date().toISOString(),
    }

    if (input.requirement_type !== undefined) {
        payload.requirement_type = input.requirement_type
    }

    if (input.is_deleted !== undefined) {
        payload.is_deleted = input.is_deleted
    }

    const { data, error } = await supabase
        .from("degree_requirement")
        .update(payload)
        .eq("id", id)
        .select(REQUIREMENT_SELECT)
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    if (!data) {
        throw new Error("Degree requirement not found")
    }

    return mapRequirementRow(
        data as DegreeRequirementRow & {
            degree?: DegreeRelation | DegreeRelation[] | null
            document_type?: DocumentTypeRelation | DocumentTypeRelation[] | null
        }
    )
}

export async function softDeleteDegreeRequirement(id: string) {
    return updateDegreeRequirement(id, { is_deleted: true })
}
