import { z } from "zod"

export const GradeTypeSchema = z.enum(["percentage", "gpa"])

export type GradeType = z.infer<typeof GradeTypeSchema>

export type OptionalGradeType = GradeType | ""

export const AcademicItemSchema = z
    .object({
        qualification: z.string().uuid("Invalid degree"),
        instituteName: z.string().min(2, "Institute name required"),
        grade_type: GradeTypeSchema,
        gpa: z.number().min(0).max(4).nullable().optional(),
        obtained_marks: z.number().min(0).nullable().optional(),
        total_marks: z.number().min(0).nullable().optional(),
        start_date: z.string().optional(),
        end_date: z.string().optional(),
        about: z.string().optional(),
    })
    .superRefine((data, ctx) => {
        if (data.grade_type === "gpa") {
            if (data.gpa == null || Number.isNaN(data.gpa)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "GPA is required",
                    path: ["gpa"],
                })
            }
            return
        }

        if (data.obtained_marks == null || data.total_marks == null) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Obtained and total marks are required",
                path: ["obtained_marks"],
            })
            return
        }

        if (data.obtained_marks > data.total_marks) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Obtained marks cannot exceed total marks",
                path: ["obtained_marks"],
            })
        }
    })

export const SaveAcademicsSchema = z.object({
    userId: z.string().uuid(),
    academics: z.array(AcademicItemSchema),
})

export type AcademicItemInput = z.infer<typeof AcademicItemSchema>

export type AcademicFormItem = {
    qualification: string
    instituteName: string
    grade_type: GradeType
    gpa: string
    obtained_marks: string
    total_marks: string
    start_date: string
    end_date: string
    about: string
}

export function resolveGradeType(item: {
    grade_type?: string | null
    gpa?: string | number | null
    obtained_marks?: string | number | null
    total_marks?: string | number | null
}): GradeType {
    if (item.grade_type === "gpa" || item.grade_type === "percentage") {
        return item.grade_type
    }

    if (item.gpa != null && item.gpa !== "") {
        return "gpa"
    }

    return "percentage"
}

export function resolveGradeTypeOptional(item: {
    grade_type?: string | null
    gpa?: string | number | null
    obtained_marks?: string | number | null
    total_marks?: string | number | null
}): OptionalGradeType {
    if (item.grade_type === "gpa" || item.grade_type === "percentage") {
        return item.grade_type
    }

    if (item.gpa != null && item.gpa !== "") {
        return "gpa"
    }

    if (
        (item.obtained_marks != null && item.obtained_marks !== "") ||
        (item.total_marks != null && item.total_marks !== "")
    ) {
        return "percentage"
    }

    return ""
}

export function createEmptyAcademicItem(): AcademicFormItem {
    return {
        qualification: "",
        instituteName: "",
        grade_type: "percentage",
        gpa: "",
        obtained_marks: "",
        total_marks: "",
        start_date: "",
        end_date: "",
        about: "",
    }
}

export function mapAcademicToFormItem(academic: {
    qualification?: string | null
    instituteName?: string | null
    grade_type?: string | null
    gpa?: string | number | null
    obtained_marks?: string | number | null
    total_marks?: string | number | null
    start_date?: string | null
    end_date?: string | null
    about?: string | null
}): AcademicFormItem {
    const grade_type = resolveGradeType(academic)

    return {
        qualification: academic.qualification ?? "",
        instituteName: academic.instituteName ?? "",
        grade_type,
        gpa: grade_type === "gpa" && academic.gpa != null ? String(academic.gpa) : "",
        obtained_marks:
            grade_type === "percentage" && academic.obtained_marks != null
                ? String(academic.obtained_marks)
                : "",
        total_marks:
            grade_type === "percentage" && academic.total_marks != null
                ? String(academic.total_marks)
                : "",
        start_date: normalizeDateValue(academic.start_date),
        end_date: normalizeDateValue(academic.end_date),
        about: academic.about ?? "",
    }
}

export function computePercentage(obtained: string, total: string): string | null {
    const obtainedValue = parseFloat(obtained)
    const totalValue = parseFloat(total)

    if (Number.isNaN(obtainedValue) || Number.isNaN(totalValue) || totalValue <= 0) {
        return null
    }

    return `${((obtainedValue / totalValue) * 100).toFixed(1)}%`
}

export function normalizeDateValue(value?: string | null): string {
    if (!value) return ""
    return value.split("T")[0] ?? value
}
