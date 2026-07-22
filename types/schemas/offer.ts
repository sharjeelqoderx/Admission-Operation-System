import { z } from "zod"

export const CreateOfferSchema = z.object({
    application_id: z.string().uuid("Invalid application id"),
    document_template_id: z.string().uuid("Invalid document template id"),
})

export type CreateOfferInput = z.infer<typeof CreateOfferSchema>

export const OfferStatusFilterSchema = z.enum(["all", "PENDING", "ACCEPTED", "REJECTED"])

/** Accepts any 8-4-4-4-12 hex id from Supabase/Postgres (Zod uuid() is RFC-4122 strict). */
export const OfferCourseIdFilterSchema = z
    .string()
    .regex(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        "Invalid course id"
    )

export const OfferListQuerySchema = z.object({
    q: z.string().optional().default(""),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    status: OfferStatusFilterSchema.optional().default("all"),
    course_id: OfferCourseIdFilterSchema.optional(),
})

export type OfferListQuery = z.infer<typeof OfferListQuerySchema>

export const offerListItemSchema = z.object({
    id: z.string().uuid(),
    status: z.string(),
    created_at: z.string(),
    application: z
        .object({
            id: z.string().uuid(),
            application_no: z.string().nullable(),
            profile_id: z.string().uuid().optional(),
            submitted_by_profile_id: z.string().uuid().nullable().optional(),
            university_id: z.string().uuid().optional(),
            student: z
                .object({
                    id: z.string().uuid(),
                    name: z.string().nullable(),
                    avatar_url: z.string().nullable(),
                    email: z.string().nullable(),
                })
                .nullable()
                .optional(),
            course: z
                .object({
                    id: z.string().uuid(),
                    name: z.string().nullable(),
                    degree: z
                        .object({
                            id: z.string().uuid(),
                            name: z.string(),
                        })
                        .nullable()
                        .optional(),
                })
                .nullable()
                .optional(),
            university: z
                .object({
                    id: z.string().uuid(),
                    name: z.string().nullable(),
                })
                .nullable()
                .optional(),
        })
        .nullable()
        .optional(),
})

export const offerListPaginationSchema = z.object({
    total: z.number().int().nonnegative(),
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    totalPages: z.number().int().nonnegative(),
})

export const offerListResponseSchema = z.object({
    data: z.array(offerListItemSchema),
    pagination: offerListPaginationSchema,
})

export type OfferListItem = z.infer<typeof offerListItemSchema>
export type OfferListPagination = z.infer<typeof offerListPaginationSchema>
export type OfferListResponse = z.infer<typeof offerListResponseSchema>

export const offerDashboardPageDataSchema = z.object({
    offers: offerListResponseSchema,
    query: z.object({
        q: z.string(),
        page: z.string(),
        limit: z.string(),
        status: z.string(),
        course_id: z.string(),
    }),
})

export type OfferDashboardPageData = z.infer<typeof offerDashboardPageDataSchema>

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
