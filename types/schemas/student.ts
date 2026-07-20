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

const requiredUploadFileSchema = z
    .instanceof(File, { message: "File is required" })
    .refine(fileWithinSizeLimit, MAX_FILE_SIZE_ERROR_MESSAGE)

// Supabase UUIDs may not pass Zod's strict RFC 4122 validator.
const optionalRecordIdSchema = z.string().optional()

export const academicRecordSchema = z
    .object({
        id: optionalRecordIdSchema,
        qualification: z.string().optional(),
        institution_name: z.string().optional(),
        grade_type: GradeTypeSchema.optional(),
        gpa: z.string().optional(),
        obtained_marks: z.string().optional(),
        total_marks: z.string().optional(),
    })
    .superRefine((val, ctx) => {
        // If this is an existing record (has id), skip all validation!
        if (val.id) {
            return;
        }

        // For new records, apply strict validation
        if (!val.qualification?.trim()) {
            ctx.addIssue({
                path: ["qualification"],
                code: "custom",
                message: "Highest degree is required",
            });
        }
        if (!val.institution_name?.trim()) {
            ctx.addIssue({
                path: ["institution_name"],
                code: "custom",
                message: "Institution is required",
            });
        }
        if (!val.grade_type) {
            ctx.addIssue({
                path: ["grade_type"],
                code: "custom",
                message: "Grade type is required",
            });
            return;
        }
        if (val.grade_type === "gpa") {
            if (!val.gpa?.trim()) {
                ctx.addIssue({
                    path: ["gpa"],
                    code: "custom",
                    message: "GPA is required",
                });
                return;
            }
            if (!/^\d+(\.\d{1,2})?$/.test(val.gpa.trim())) {
                ctx.addIssue({
                    path: ["gpa"],
                    code: "custom",
                    message: "Must be a valid number",
                });
                return;
            }
            const gpaValue = parseFloat(val.gpa);
            if (gpaValue < 0 || gpaValue > 4) {
                ctx.addIssue({
                    path: ["gpa"],
                    code: "custom",
                    message: "GPA must be between 0 and 4",
                });
            }
            return;
        }

        if (!val.obtained_marks?.trim()) {
            ctx.addIssue({
                path: ["obtained_marks"],
                code: "custom",
                message: "Obtained marks is required",
            });
        } else if (!/^\d+(\.\d{1,2})?$/.test(val.obtained_marks.trim())) {
            ctx.addIssue({
                path: ["obtained_marks"],
                code: "custom",
                message: "Must be a valid number",
            });
        }

        if (!val.total_marks?.trim()) {
            ctx.addIssue({
                path: ["total_marks"],
                code: "custom",
                message: "Total marks is required",
            });
        } else if (!/^\d+(\.\d{1,2})?$/.test(val.total_marks.trim())) {
            ctx.addIssue({
                path: ["total_marks"],
                code: "custom",
                message: "Must be a valid number",
            });
        }

        if (
            val.obtained_marks?.trim() &&
            val.total_marks?.trim() &&
            parseFloat(val.obtained_marks) > parseFloat(val.total_marks)
        ) {
            ctx.addIssue({
                path: ["obtained_marks"],
                code: "custom",
                message: "Obtained marks cannot exceed total marks",
            });
        }
    })

// Base schema for both create and edit
const BaseStudentFormSchema = z.object({
    title: z.string().optional(),
    first_name: z.string().min(2, "First name is required"),
    last_name: z.string().min(2, "Last name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().min(1, "Phone is required"),
    dob: z.string().min(1, "Date of birth is required"),
    gender: z.enum(["MALE", "FEMALE"], { message: "Gender is required" }),
    country: z.string().min(1, "Country is required"),
    state: z.string().min(1, "State is required"),
    city: z.string().min(1, "City is required"),
    nationality: z.string().min(1, "Nationality is required"),
    guardian_email: z.union([
        z.literal(""),
        z.string().trim().email("Invalid guardian email format"),
    ]),
    guardian_phone: z.union([
        z.literal(""),
        z
            .string()
            .trim()
            .regex(/^\+?[\d\s\-()]{8,30}$/, "Invalid guardian phone number"),
    ]),
    avatar_url: optionalUploadFileSchema,
    passport_file_url: optionalUploadFileSchema,
})

// Edit schema: relaxed academic validation
const relaxedAcademicRecordSchema = z.object({
    id: optionalRecordIdSchema,
    qualification: z.string().optional(),
    institution_name: z.string().optional(),
    grade_type: z.union([GradeTypeSchema, z.literal("")]).optional(),
    gpa: z.string().optional(),
    obtained_marks: z.string().optional(),
    total_marks: z.string().optional(),
})

export const StudentFormSchema = BaseStudentFormSchema.extend({
    academic_background: z.array(relaxedAcademicRecordSchema),
})

// Create schema: strict academic validation
export const StudentCreateFormSchema = BaseStudentFormSchema.extend({
    title: z.enum(["Mr", "Mrs", "Ms"], { message: "Title is required" }),
    academic_background: z.array(academicRecordSchema).min(1),
}).superRefine((data, ctx) => {
    const mappedGender =
        data.title === "Mr"
            ? "MALE"
            : data.title === "Mrs" || data.title === "Ms"
                ? "FEMALE"
                : undefined
    if (!mappedGender || data.gender !== mappedGender) {
        ctx.addIssue({
            path: ["gender"],
            code: "custom",
            message: "Select a title to set gender",
        })
    }
})

export type StudentInput = z.infer<typeof StudentFormSchema>
export type StudentCreateInput = z.infer<typeof StudentCreateFormSchema>
