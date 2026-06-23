import { z } from "zod"
import { studentPipelineStatusSchema } from "@/types/schemas/university-student"

export const universityApplicationTabSchema = z.enum([
    "all",
    "pending-review",
    "awaiting-signature",
    "recently-completed",
])

export const universityApplicationListItemSchema = z.object({
    id: z.string().uuid(),
    student_name: z.string(),
    student_code: z.string().nullable(),
    avatar_url: z.string().nullable(),
    program_name: z.string().nullable(),
    intake_label: z.string().nullable(),
    agent_name: z.string(),
    pipeline_status: studentPipelineStatusSchema,
    submission_date: z.string().nullable(),
})

export const universityApplicationTabCountsSchema = z.object({
    all: z.number(),
    pending_review: z.number(),
    awaiting_signature: z.number(),
    recently_completed: z.number(),
})

export const universityApplicationListResponseSchema = z.object({
    tab_counts: universityApplicationTabCountsSchema,
    data: z.array(universityApplicationListItemSchema),
    pagination: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
})

export const universityApplicationDocumentSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    status: z.enum(["verified", "pending", "missing", "action_required"]),
    status_label: z.string().nullable(),
})

export const universityApplicationProgressStepSchema = z.object({
    key: z.string(),
    label: z.string(),
    status: z.enum(["completed", "pending"]),
    meta: z.string().nullable(),
})

export const universityApplicationDetailSchema = z.object({
    id: z.string().uuid(),
    display_id: z.string().nullable(),
    application_status: z.string(),
    student_name: z.string(),
    email: z.string().nullable(),
    location: z.string().nullable(),
    avatar_url: z.string().nullable(),
    profile_id: z.string().uuid(),
    academic_record: z.object({
        previous_degree: z.string().nullable(),
        institution_name: z.string().nullable(),
        gpa_label: z.string().nullable(),
        honors_label: z.string().nullable(),
        program_selection: z.string().nullable(),
        intake_label: z.string().nullable(),
        tuition_status: z.string().nullable(),
        tuition_total: z.string().nullable(),
    }),
    documents: z.array(universityApplicationDocumentSchema),
    documents_verified_count: z.number(),
    documents_total_count: z.number(),
    progress: z.object({
        program_name: z.string().nullable(),
        steps: z.array(universityApplicationProgressStepSchema),
    }),
    submission_source: z
        .object({
            organization: z.string(),
            agent_name: z.string().nullable(),
        })
        .nullable(),
    can_approve_for_signature: z.boolean(),
    has_offer: z.boolean(),
})

export type UniversityApplicationTab = z.infer<typeof universityApplicationTabSchema>
export type UniversityApplicationListItem = z.infer<typeof universityApplicationListItemSchema>
export type UniversityApplicationListResponse = z.infer<typeof universityApplicationListResponseSchema>
export type UniversityApplicationDetail = z.infer<typeof universityApplicationDetailSchema>

export type UniversityApplicationDetailPageData = {
    detail: UniversityApplicationDetail | null
    error: string | null
}
