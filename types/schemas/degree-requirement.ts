import { z } from "zod"
import { PostgresUuidSchema } from "@/types/schemas/uuid"

export const DocumentRequirementTypeSchema = z.enum(["REQUIRED", "OPTIONAL"])

export const DegreeRequirementCreateSchema = z.object({
    degree_id: PostgresUuidSchema,
    document_type_id: PostgresUuidSchema,
    requirement_type: DocumentRequirementTypeSchema.default("REQUIRED"),
})

export const DegreeRequirementUpdateSchema = z.object({
    requirement_type: DocumentRequirementTypeSchema.optional(),
    is_deleted: z.boolean().optional(),
})

export type DocumentRequirementType = z.infer<typeof DocumentRequirementTypeSchema>
export type DegreeRequirementCreateInput = z.infer<typeof DegreeRequirementCreateSchema>
export type DegreeRequirementUpdateInput = z.infer<typeof DegreeRequirementUpdateSchema>

export type DegreeRequirementListItem = {
    id: string
    degree_id: string
    degree_name: string
    degree_location: string | null
    document_type_id: string
    document_type_name: string
    document_type_code: string | null
    requirement_type: DocumentRequirementType
    is_deleted: boolean
    created_at: string
    updated_at: string
}

export type DegreeRequirementListResponse = {
    data: DegreeRequirementListItem[]
}

export type DegreeRequirementDetailResponse = {
    data: DegreeRequirementListItem
}

export type DegreeRequirementDegreeOption = {
    id: string
    label: string
}

export type DegreeRequirementDocumentTypeOption = {
    id: string
    label: string
    code: string | null
}

export type DegreeRequirementOptionsResponse = {
    data: {
        degrees: DegreeRequirementDegreeOption[]
        document_types: DegreeRequirementDocumentTypeOption[]
    }
}
