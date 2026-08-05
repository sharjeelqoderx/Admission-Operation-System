import { z } from "zod"
import type { AdmissionRequirementId } from "@/lib/document-template/checklist-items"
import { PostgresUuidSchema } from "@/types/schemas/uuid"

export const DocumentTemplateFormSchema = z.object({
    title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
    body_html: z.string(),
    program_id: PostgresUuidSchema.nullable().optional(),
})

export const DocumentTemplateUpdateSchema = DocumentTemplateFormSchema.partial()

export type DocumentTemplateFormInput = z.infer<typeof DocumentTemplateFormSchema>
export type DocumentTemplateUpdateInput = z.infer<typeof DocumentTemplateUpdateSchema>

export type DocumentTemplateProgramOption = {
    id: string
    label: string
    is_assigned: boolean
    assigned_template_id: string | null
    assigned_template_title: string | null
}

export type DocumentTemplateProgramOptionsResponse = {
    data: DocumentTemplateProgramOption[]
}

export type DocumentTemplateListItem = {
    id: string
    title: string
    body_html: string
    variables: string[]
    checklist_items: AdmissionRequirementId[]
    checklist_profile: string | null
    program_id: string | null
    program_label: string | null
    created_by_profile_id: string
    created_at: string
    updated_at: string
}

export type DocumentTemplatesListResponse = {
    data: DocumentTemplateListItem[]
}

export type DocumentTemplateDetailResponse = {
    data: DocumentTemplateListItem
}

export type DocumentTemplateAsset = {
    name: string
    path: string
    url: string
    created_at: string | null
}

export type DocumentTemplateAssetsResponse = {
    data: DocumentTemplateAsset[]
}
