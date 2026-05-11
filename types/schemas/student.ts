import { z } from "zod"

export const StudentFormSchema = z.object({
    full_name: z.string().min(2, "Full name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().min(1, "Phone is required"),
    dob: z.string().min(1, "Date of birth is required"),
    gender: z.enum(["MALE", "FEMALE"], { message: "Gender is required" }),
    country: z.string().min(1, "Country is required"),
    nationality: z.string().min(1, "Nationality is required"),
    guardian_email: z.string().email("Valid guardian email is required"),
    guardian_phone: z.string().min(1, "Guardian phone is required"),

    academic_background: z.array(
        z.object({
            qualification: z.string().min(1, "Qualification is required"),
            institution_name: z.string().min(1, "Institution is required"),
            gpa: z.string().regex(/^([0-3](\.\d{1,2})?|4(\.0{1,2})?)$/, "GPA must be 0.0 – 4.0"),
        })
    ).min(1),

    avatar_url: z.instanceof(File).optional(),
    passport_file_url: z.instanceof(File).optional(),
})

export type StudentInput = z.infer<typeof StudentFormSchema>