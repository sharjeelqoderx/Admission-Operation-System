import { z } from "zod"

export const CreateOfferSchema = z.object({
    application_id: z.string().uuid("Invalid application id"),
    document_template_id: z.string().uuid("Invalid document template id"),
})

export type CreateOfferInput = z.infer<typeof CreateOfferSchema>

export const OfferChecklistPreviewQuerySchema = z.object({
    application_id: z.string().uuid("Invalid application id"),
})

export const OfferChecklistPreviewItemSchema = z.object({
    id: z.string(),
    label: z.string(),
    fulfilled: z.boolean(),
})

export const OfferTemplateChecklistPreviewSchema = z.object({
    template_id: z.string().uuid(),
    total_count: z.number().int().nonnegative(),
    fulfilled_count: z.number().int().nonnegative(),
    items: z.array(OfferChecklistPreviewItemSchema),
})

export const OfferChecklistPreviewResponseSchema = z.object({
    data: z.object({
        templates: z.array(OfferTemplateChecklistPreviewSchema),
    }),
})

export type OfferChecklistPreviewItem = z.infer<typeof OfferChecklistPreviewItemSchema>
export type OfferTemplateChecklistPreview = z.infer<typeof OfferTemplateChecklistPreviewSchema>
export type OfferChecklistPreviewResponse = z.infer<typeof OfferChecklistPreviewResponseSchema>
