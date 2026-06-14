import { z } from "zod"
import { fileWithinSizeLimit, MAX_FILE_SIZE_ERROR_MESSAGE } from "@/lib/constants/file-upload"
import { GradeTypeSchema } from "@/types/schemas/academic"

const optionalUploadFileSchema = z
    .union([
        z.instanceof(File).refine(fileWithinSizeLimit, MAX_FILE_SIZE_ERROR_MESSAGE),
        z.null(),
        z.undefined(),
    ])
    .optional()

export const academicRecordSchema = z
    .object({
        id: z.string().uuid().optional(),
        qualification: z.string().min(1, "Highest degree is required"),
        institution_name: z.string().min(1, "Institution is required"),
        grade_type: GradeTypeSchema,
        gpa: z.string(),
        obtained_marks: z.string(),
        total_marks: z.string(),
    })
    .superRefine((val, ctx) => {
        if (val.grade_type === "gpa") {
            if (!val.gpa.trim()) {
                ctx.addIssue({
                    path: ["gpa"],
                    code: "custom",
                    message: "GPA is required",
                })
                return
            }
            if (!/^\d+(\.\d{1,2})?$/.test(val.gpa.trim())) {
                ctx.addIssue({
                    path: ["gpa"],
                    code: "custom",
                    message: "Must be a valid number",
                })
                return
            }
            const gpaValue = parseFloat(val.gpa)
            if (gpaValue < 0 || gpaValue > 4) {
                ctx.addIssue({
                    path: ["gpa"],
                    code: "custom",
                    message: "GPA must be between 0 and 4",
                })
            }
            return
        }

        if (!val.obtained_marks.trim()) {
            ctx.addIssue({
                path: ["obtained_marks"],
                code: "custom",
                message: "Obtained marks is required",
            })
        } else if (!/^\d+(\.\d{1,2})?$/.test(val.obtained_marks.trim())) {
            ctx.addIssue({
                path: ["obtained_marks"],
                code: "custom",
                message: "Must be a valid number",
            })
        }

        if (!val.total_marks.trim()) {
            ctx.addIssue({
                path: ["total_marks"],
                code: "custom",
                message: "Total marks is required",
            })
        } else if (!/^\d+(\.\d{1,2})?$/.test(val.total_marks.trim())) {
            ctx.addIssue({
                path: ["total_marks"],
                code: "custom",
                message: "Must be a valid number",
            })
        }

        if (
            val.obtained_marks.trim() &&
            val.total_marks.trim() &&
            parseFloat(val.obtained_marks) > parseFloat(val.total_marks)
        ) {
            ctx.addIssue({
                path: ["obtained_marks"],
                code: "custom",
                message: "Obtained marks cannot exceed total marks",
            })
        }
    })

export const StudentFormSchema = z.object({
    full_name: z.string().min(2, "Full name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().min(1, "Phone is required"),
    dob: z.string().min(1, "Date of birth is required"),
    gender: z.enum(["MALE", "FEMALE"], { message: "Gender is required" }),
    country: z.string().min(1, "Country is required"),
    state: z.string().min(1, "State is required"),
    city: z.string().min(1, "City is required"),
    nationality: z.string().min(1, "Nationality is required"),
    guardian_email: z.string().email("Valid guardian email is required"),
    guardian_phone: z.string().min(1, "Guardian phone is required"),

    academic_background: z.array(academicRecordSchema).min(1),

    avatar_url: optionalUploadFileSchema,
    passport_file_url: optionalUploadFileSchema,
})

export type StudentInput = z.infer<typeof StudentFormSchema>
