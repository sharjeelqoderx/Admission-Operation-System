import { z } from "zod"
import type { AdmissionRequirementId } from "@/lib/document-template/checklist-items"
import type { DocumentTemplateDates } from "@/lib/document-template/date-variables"
import type { DocumentTemplateWatermark } from "@/lib/document-template/watermark"
import { PostgresUuidSchema } from "@/types/schemas/uuid"

export const TemplateLocaleSchema = z.enum(["de", "en"])

export const DocumentTemplateDatesSchema = z.object({
    program_period_start: z.string().nullable().optional(),
    program_period_end: z.string().nullable().optional(),
    classes_start_date: z.string().nullable().optional(),
    enrollment_start_date: z.string().nullable().optional(),
    enrollment_end_date: z.string().nullable().optional(),
    visa_participation_deadline: z.string().nullable().optional(),
})

export const DocumentTemplateWatermarkPositionSchema = z.enum(["center", "top", "bottom"])

export const DocumentTemplateWatermarkSchema = z.object({
    enabled: z.boolean(),
    image_url: z.string().nullable().optional(),
    opacity: z.number().min(0).max(1).optional(),
    size_px: z.number().int().positive().optional(),
    position: DocumentTemplateWatermarkPositionSchema.optional(),
    rotation_deg: z.number().min(-180).max(180).optional(),
})

export const DocumentTemplateFormSchema = z.object({
    title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
    body_html: z.string(),
    course_ids: z.array(PostgresUuidSchema).optional(),
    /** @deprecated Use course_ids */
    program_ids: z.array(PostgresUuidSchema).optional(),
    course_id: PostgresUuidSchema.nullable().optional(),
    /** @deprecated Use course_id / course_ids */
    program_id: PostgresUuidSchema.nullable().optional(),
    locale: TemplateLocaleSchema.default("en"),
    template_dates: DocumentTemplateDatesSchema.optional(),
    watermark: DocumentTemplateWatermarkSchema.optional(),
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

export type TemplateLocale = z.infer<typeof TemplateLocaleSchema>

export type DocumentTemplateCourseSummary = {
    id: string
    label: string
}

export type DocumentTemplateListItem = {
    id: string
    title: string
    body_html: string
    locale: TemplateLocale
    template_dates: DocumentTemplateDates
    watermark: DocumentTemplateWatermark
    variables: string[]
    checklist_items: AdmissionRequirementId[]
    checklist_profile: string | null
    courses: DocumentTemplateCourseSummary[]
    course_ids: string[]
    course_id: string | null
    course_label: string | null
    /** @deprecated Use course_ids */
    program_ids: string[]
    /** @deprecated Use course_id */
    program_id: string | null
    /** @deprecated Use course_label */
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
