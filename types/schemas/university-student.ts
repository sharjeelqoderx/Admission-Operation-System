import { z } from "zod"

export const studentPipelineStatusSchema = z.enum([
    "Created",
    "Contract Sent",
    "Signed",
    "Completed",
])

export const universityStudentListItemSchema = z.object({
    profile_id: z.string().uuid(),
    name: z.string(),
    student_code: z.string().nullable(),
    program_name: z.string().nullable(),
    intake_label: z.string().nullable(),
    applied_through: z.enum(["Direct", "Agent"]),
    pipeline_status: studentPipelineStatusSchema,
    submission_date: z.string().nullable(),
})

export const universityStudentListStatsSchema = z.object({
    total_students: z.number(),
    applied: z.number(),
    enrolled: z.number(),
})

export const universityStudentListResponseSchema = z.object({
    stats: universityStudentListStatsSchema,
    data: z.array(universityStudentListItemSchema),
    pagination: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
})

export const universityStudentProgressStepSchema = z.object({
    key: z.string(),
    label: z.string(),
    status: z.enum(["completed", "pending"]),
    meta: z.string().nullable(),
})

export const universityStudentApplicationSchema = z.object({
    id: z.string().uuid(),
    application_no: z.string().nullable(),
    program_name: z.string().nullable(),
    intake_label: z.string().nullable(),
    pipeline_status: studentPipelineStatusSchema,
    submission_date: z.string(),
})

export const universityStudentDetailSchema = z.object({
    profile_id: z.string().uuid(),
    display_id: z.string().nullable(),
    name: z.string(),
    email: z.string().nullable(),
    location: z.string().nullable(),
    avatar_url: z.string().nullable(),
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
    basic_info: z.object({
        name: z.string(),
        email: z.string().nullable(),
        date_of_birth: z.string().nullable(),
        nationality: z.string().nullable(),
        phone: z.string().nullable(),
        guardian_phone: z.string().nullable(),
    }),
    applications: z.array(universityStudentApplicationSchema),
    progress: z.object({
        program_name: z.string().nullable(),
        steps: z.array(universityStudentProgressStepSchema),
    }),
    submission_source: z
        .object({
            organization: z.string(),
            agent_name: z.string().nullable(),
        })
        .nullable(),
})

export type StudentPipelineStatus = z.infer<typeof studentPipelineStatusSchema>
export type UniversityStudentListItem = z.infer<typeof universityStudentListItemSchema>
export type UniversityStudentListResponse = z.infer<typeof universityStudentListResponseSchema>
export type UniversityStudentDetail = z.infer<typeof universityStudentDetailSchema>
