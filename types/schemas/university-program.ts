import { z } from "zod"

export const universityProgramListItemSchema = z.object({
    id: z.string().uuid(),
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
    agent_commission: z.coerce
        .number()
        .min(0, "Commission cannot be less than 0%")
        .max(100, "Commission cannot exceed 100%")
        .optional()
        .nullable(),
    location: z.string().trim().optional(),
    program_length: z.string().trim().optional(),
    study_type: z.enum(["full_time", "part_time"]).optional().nullable(),
    intake_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Intake date must be YYYY-MM-DD")
        .optional()
        .nullable(),
    application_deadline: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Deadline must be YYYY-MM-DD")
        .optional()
        .nullable(),
    level_id: z.string().uuid().optional().nullable(),
    program_detail: z.string().trim().optional(),
    admission_requirements: z.string().trim().optional(),
    perspectives: z.string().trim().optional(),
    prospects_after_graduation: z.string().trim().optional(),
    competency_model: z.string().trim().optional(),
    professional_skills: z.string().trim().optional(),
    management_skills: z.string().trim().optional(),
    document_type_ids: z.array(z.string().uuid()).optional(),
    document_requirements: z
        .array(
            z.object({
                document_type_id: z.string().uuid(),
                requirement_type: z.enum(["REQUIRED", "OPTIONAL"]),
            })
        )
        .optional(),
    university_profile_id: z.string().uuid().optional(),
})

export const universityProgramDetailSchema = universityProgramUpsertSchema.extend({
    id: z.string().uuid(),
    status: z.string(),
    document_requirements: z.array(
        z.object({
            id: z.string().uuid(),
            document_type_id: z.string().uuid(),
            name: z.string().nullable(),
            requirement_type: z.enum(["REQUIRED", "OPTIONAL"]),
        })
    ),
})

export type UniversityProgramListItem = z.infer<typeof universityProgramListItemSchema>
export type UniversityProgramListResponse = z.infer<typeof universityProgramListResponseSchema>
export type UniversityProgramUpsert = z.infer<typeof universityProgramUpsertSchema>
export type UniversityProgramDetail = z.infer<typeof universityProgramDetailSchema>
