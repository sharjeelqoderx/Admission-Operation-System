import { z } from "zod"
import { studentPipelineStatusSchema } from "@/types/schemas/university-student"

export const agentKycStatusSchema = z.enum([
    "Pending",
    "Under Review",
    "Resubmission",
    "Approved",
    "Rejected",
    "Suspended",
])

export const universityAgentListItemSchema = z.object({
    profile_id: z.string().uuid(),
    agent_id: z.string().uuid(),
    agency_name: z.string(),
    display_id: z.string(),
    country: z.string().nullable(),
    kyc_status: agentKycStatusSchema,
    students_count: z.number(),
})

export const universityAgentListStatsSchema = z.object({
    total_agents: z.number(),
    verified: z.number(),
})

export const universityAgentListResponseSchema = z.object({
    stats: universityAgentListStatsSchema,
    data: z.array(universityAgentListItemSchema),
    pagination: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
})

export const universityAgentDocumentSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    uploaded_at: z.string().nullable(),
    file_url: z.string().nullable(),
})

export const universityAgentStudentSchema = z.object({
    profile_id: z.string().uuid(),
    student_code: z.string().nullable(),
    program_name: z.string().nullable(),
    intake_label: z.string().nullable(),
    pipeline_status: studentPipelineStatusSchema,
    submission_date: z.string().nullable(),
})

export const universityAgentDetailSchema = z.object({
    profile_id: z.string().uuid(),
    agent_id: z.string().uuid(),
    display_id: z.string(),
    name: z.string(),
    email: z.string().nullable(),
    location: z.string().nullable(),
    avatar_url: z.string().nullable(),
    students_count: z.number(),
    enrolled_count: z.number(),
    agency_info: z.object({
        agency_name: z.string().nullable(),
        address: z.string().nullable(),
        experience_years: z.number().nullable(),
        phone: z.string().nullable(),
        other_contact_number: z.string().nullable(),
    }),
    basic_info: z.object({
        email: z.string().nullable(),
        gender: z.string().nullable(),
        nationality: z.string().nullable(),
        country: z.string().nullable(),
        phone: z.string().nullable(),
        other_contact_number: z.string().nullable(),
        website: z.string().nullable(),
        address: z.string().nullable(),
    }),
    documents: z.array(universityAgentDocumentSchema),
    students: z.array(universityAgentStudentSchema),
})

export type AgentKycStatus = z.infer<typeof agentKycStatusSchema>
export type UniversityAgentListItem = z.infer<typeof universityAgentListItemSchema>
export type UniversityAgentListResponse = z.infer<typeof universityAgentListResponseSchema>
export type UniversityAgentDetail = z.infer<typeof universityAgentDetailSchema>
