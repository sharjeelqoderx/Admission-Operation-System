import { z } from "zod"

export const CreateOfferSchema = z.object({
    application_id: z.string().uuid("Invalid application id"),
    document_template_id: z.string().uuid("Invalid document template id"),
})

export type CreateOfferInput = z.infer<typeof CreateOfferSchema>
