import { z } from "zod"
import { fileWithinSizeLimit, MAX_FILE_SIZE_ERROR_MESSAGE } from "@/lib/constants/file-upload"
import type { CourseProgram } from "@/types/schemas/program"

const uploadFileSchema = z
    .instanceof(File)
    .refine(fileWithinSizeLimit, MAX_FILE_SIZE_ERROR_MESSAGE)

export const DocumentFormSchema = z.object({
    student_id: z.string().min(1, "Please select a student"),
    document_type_id: z.string().min(1, "Please select a document type"),
    files: z.array(uploadFileSchema).min(1, "At least one file is required").max(2, "Maximum 2 files allowed"),
    comment: z.string().optional(),
})

export type DocumentInput = z.infer<typeof DocumentFormSchema>

export type UploadedDocumentSummary = {
    document_id: string
    status: string
    feedback: string | null
    note: string | null
    files: Array<{ file_url: string; type: string | null }>
    created_at: string
    updated_at: string | null
}

export type CourseRequiredDocument = {
    requirement_id: string
    document_type_id: string
    requirement_type: "REQUIRED" | "OPTIONAL"
    name: string
    description: string | null
    code: string | null
    uploaded: UploadedDocumentSummary | null
}

export type CourseDocumentBundle = {
    course: CourseProgram
    required_documents: CourseRequiredDocument[]
    total_required: number
    uploaded_count: number
    completion_percentage: number
}

export type CourseDocumentsResponse = {
    profile_id: string
    degree_bundles: DegreeDocumentBundle[]
}

export type DegreeDocumentBundle = {
    degree: {
        id: string
        name: string
        credits: number | null
        location: string | null
        language_of_study: string | null
        duration: string | null
        fees: number | string | null
        study_mode: string | null
        intake_date: string | null
        level: { id: string; name: string } | null
        levels: Array<{ id: string; name: string }>
    }
    courses: Array<{
        id: string
        name: string
        deadline_date: string | null
    }>
    required_documents: CourseRequiredDocument[]
    total_required: number
    uploaded_count: number
    completion_percentage: number
}

export const CourseDocumentUploadItemSchema = z.object({
    document_type_id: z.string().uuid(),
    note: z.string().optional(),
    files: z.array(uploadFileSchema).min(1, "At least one file is required").max(2, "Maximum 2 files allowed"),
})

export type CourseDocumentUploadItem = z.infer<typeof CourseDocumentUploadItemSchema>

export const SaveDegreeDocumentsSchema = z.object({
    profile_id: z.string().uuid(),
    uploads: z.array(CourseDocumentUploadItemSchema).min(1, "Select at least one document to upload"),
})

export type SaveDegreeDocumentsInput = z.infer<typeof SaveDegreeDocumentsSchema>

export const DocumentReviewActionSchema = z
    .object({
        status: z.enum(["APPROVED", "REJECTED"]),
        feedback: z.string().optional(),
    })
    .superRefine((data, ctx) => {
        if (data.status === "REJECTED" && !data.feedback?.trim()) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Rejection reason is required",
                path: ["feedback"],
            })
        }
    })

export type DocumentReviewActionInput = z.infer<typeof DocumentReviewActionSchema>

export type AgentAllDocumentRow = {
    document_id: string
    review_id: string | null
    document_name: string
    status: string
    feedback: string | null
    student_id: string
    student_name: string
    avatar_url: string | null
    student_code: string | null
    student_country: string | null
    campus: string | null
    uploaded_at: string
    uploaded_by_name: string | null
    file_count: number
}

export type AgentAllDocumentsResponse = {
    data: AgentAllDocumentRow[]
}
