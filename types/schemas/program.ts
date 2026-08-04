import { z } from "zod"
import type { Tables } from "@/types/supabase"
import { PostgresUuidSchema } from "@/types/schemas/uuid"

export const ProgramListQuerySchema = z.object({
    search: z.string().trim().optional(),
    level_id: PostgresUuidSchema.optional(),
    intake_date: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    offset: z.coerce.number().int().min(0).default(0),
})

export type ProgramListQuery = z.infer<typeof ProgramListQuerySchema>

export const ProgramDetailParamsSchema = z.object({
    id: PostgresUuidSchema,
})

export type ProgramDetailParams = z.infer<typeof ProgramDetailParamsSchema>

type DocumentTypeSummary = Pick<
    Tables<"document_type">,
    "id" | "name" | "code" | "type" | "description" | "is_active" | "may_expire"
>

export type CourseRequirement = Pick<
    Tables<"degree_requirement">,
    "id" | "requirement_type" | "created_at" | "updated_at"
> & {
    document_type: DocumentTypeSummary | null
}

export type CourseDegree = Tables<"degree"> & {
    level: Pick<Tables<"levels">, "id" | "name"> | null
    requirements: CourseRequirement[]
}

export type CourseProgramContent = Pick<
    Tables<"program">,
    | "id"
    | "category"
    | "location"
    | "program_length"
    | "program_detail"
    | "admission_requirements"
    | "perspectives"
    | "prospects_after_graduation"
    | "competency_model"
    | "professional_skills"
    | "management_skills"
    | "status"
>

export type CourseProgramDocumentRequirement = {
    id: string
    document_type_id: string
    name: string | null
}

export type CourseProgram = Tables<"course"> & {
    degree: CourseDegree | null
    program?: CourseProgramContent | null
    document_requirements?: CourseProgramDocumentRequirement[]
}

export type ProgramListResponse = {
    data: CourseProgram[]
    pagination: {
        total: number
        limit: number
        offset: number
        hasMore: boolean
    }
}
