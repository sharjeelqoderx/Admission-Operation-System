import { z } from "zod"
import { PostgresUuidSchema } from "@/types/schemas/uuid"

/** Empty string / undefined → null so optional UUID fields never trip validation. */
const optionalPostgresUuid = z.preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    PostgresUuidSchema.nullable()
)

/** Empty string / undefined → null for optional YYYY-MM-DD dates. */
const optionalProgramDate = z.preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
        .nullable()
)

const optionalStudyType = z.preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    z.enum(["full_time", "part_time"]).nullable()
)

export const universityProgramListItemSchema = z.object({
    id: PostgresUuidSchema,
    name: z.string(),
    category: z.string().nullable(),
    level_name: z.string().nullable(),
    intake_label: z.string().nullable(),
    deadline_label: z.string().nullable(),
    location: z.string().nullable(),
    duration: z.string().nullable(),
    tuition_fees: z.string().nullable(),
    agent_commission: z.number().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
})

export const universityProgramListResponseSchema = z.object({
    data: z.array(universityProgramListItemSchema),
    pagination: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
})

export const universityProgramUpsertSchema = z.object({
    name: z.string().trim().min(1, "Program name is required"),
    category: z.string().trim().optional(),
    tuition_fees: z.string().trim().optional(),
    agent_commission: z.preprocess(
        (value) => (value === "" || value === undefined ? null : value),
        z.coerce
            .number()
            .min(0, "Commission cannot be less than 0%")
            .max(100, "Commission cannot exceed 100%")
            .nullable()
    ),
    location: z.string().trim().optional(),
    program_length: z.string().trim().optional(),
    study_type: optionalStudyType,
    intake_date: optionalProgramDate,
    application_deadline: optionalProgramDate,
    level_id: optionalPostgresUuid,
    program_detail: z.string().trim().optional(),
    admission_requirements: z.string().trim().optional(),
    perspectives: z.string().trim().optional(),
    prospects_after_graduation: z.string().trim().optional(),
    competency_model: z.string().trim().optional(),
    professional_skills: z.string().trim().optional(),
    management_skills: z.string().trim().optional(),
    document_type_ids: z.array(PostgresUuidSchema).optional(),
    document_requirements: z
        .array(
            z.object({
                document_type_id: PostgresUuidSchema,
                requirement_type: z.enum(["REQUIRED", "OPTIONAL"]),
            })
        )
        .optional(),
    university_profile_id: optionalPostgresUuid.optional(),
})

export const universityProgramDetailSchema = universityProgramUpsertSchema.extend({
    id: PostgresUuidSchema,
    status: z.string(),
    document_requirements: z.array(
        z.object({
            id: PostgresUuidSchema,
            document_type_id: PostgresUuidSchema,
            name: z.string().nullable(),
            requirement_type: z.enum(["REQUIRED", "OPTIONAL"]),
        })
    ),
})

export type UniversityProgramListItem = z.infer<typeof universityProgramListItemSchema>
export type UniversityProgramListResponse = z.infer<typeof universityProgramListResponseSchema>
export type UniversityProgramUpsert = z.infer<typeof universityProgramUpsertSchema>
export type UniversityProgramDetail = z.infer<typeof universityProgramDetailSchema>
