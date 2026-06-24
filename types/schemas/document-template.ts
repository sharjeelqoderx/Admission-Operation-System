import { z } from "zod"

export const DocumentTemplateFormSchema = z.object({
    title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
    body_html: z.string(),
})

export const DocumentTemplateUpdateSchema = DocumentTemplateFormSchema.partial()

export type DocumentTemplateFormInput = z.infer<typeof DocumentTemplateFormSchema>
export type DocumentTemplateUpdateInput = z.infer<typeof DocumentTemplateUpdateSchema>

export type DocumentTemplateListItem = {
    id: string
    title: string
    body_html: string
    variables: string[]
    checklist_items: string[]
    checklist_profile: string | null
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
