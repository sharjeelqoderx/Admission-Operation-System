import { z } from "zod"

export const AddStudentSchema = z.object({
    full_name: z.string().min(2, "Full name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().min(7, "Phone is required").regex(/^\+?[0-9\s\-().]{7,20}$/, "Enter a valid phone number"),
    password: z
        .string()
        .min(8, "At least 8 characters")
        .regex(/[A-Z]/, "Must contain uppercase")
        .regex(/[0-9]/, "Must contain a number"),
    dob: z.string().min(1, "Date of birth is required"),
    gender: z.enum(["MALE", "FEMALE"], { message: "Gender is required" }),
    country: z.string().min(2, "Country is required"),
    nationality: z.string().min(2, "Nationality is required"),
    guardian_email: z.string().email("Valid guardian email is required"),
    guardian_phone: z.string().min(7, "Guardian phone is required").regex(/^\+?[0-9\s\-().]{7,20}$/, "Enter a valid phone number"),
    qualification: z.string().min(1, "Qualification is required"),
    institution_name: z.string().min(1, "Institution name is required"),
    gpa: z.string().min(1, "GPA is required").regex(/^([0-3](\.\d{1,2})?|4(\.0{1,2})?)$/, "GPA must be between 0.0 – 4.0"),
    avatar_url: z.instanceof(File, { message: "Profile picture is required" }),
})

export type AddStudentInput = z.infer<typeof AddStudentSchema>
