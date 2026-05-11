import { z } from "zod";
import { Gender } from "..";

/* =========================
   HELPERS
========================= */

const email = z
    .string()
    .trim()
    .min(1, "Email is required")
    .max(254, "Email too long")
    .email("Invalid email format")
    .transform((val) => val.toLowerCase());

const phone = z
    .string()
    .trim()
    .min(1, "Phone is required")
    .regex(/^\+?\d{10,15}$/, "Invalid phone number");

const password = z
    .string()
    .min(1, "Password is required")
    .min(8, "At least 8 characters")
    .max(128, "Password too long")
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[a-z]/, "Must contain lowercase")
    .regex(/[0-9]/, "Must contain number")
    .regex(/[^A-Za-z0-9]/, "Must contain special character");

/* =========================
   LOGIN
========================= */

export const loginSchema = z.object({
    email,
    password,
});

/* =========================
   SIGNUP
========================= */

export const signupSchema = z.object({
    fullName: z
        .string()
        .trim()
        .min(1, "Name is Required")
        .min(2, "Name is Too Short")
        .regex(/^[a-zA-Z\s]+$/, "Only letters allowed"),
    email,
    phone,
    password,
    role: z.enum(["AGENT", "STUDENT"]).default("STUDENT"),
});

/* =========================
   OTP
========================= */

export const otpSchema = z.object({
    otp: z
        .string()
        .trim()
        .min(1, "Please enter OTP")
        .length(8, "OTP must be exactly 8 digits")
        .regex(/^\d{8}$/, "OTP must be numeric"),
});

/* =========================
   FORGOT PASSWORD
========================= */

export const forgotPasswordSchema = z.object({
    email,
});

/* =========================
   RESET PASSWORD
========================= */

export const resetPasswordSchema = z.object({
    password,
    confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine(d => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
});

/* =========================
   AGENT STEP 1 — Agency Info
========================= */

export const agentStep1Schema = z.object({
    agencyName: z.string().trim().min(2, "Agency name is required"),
    agencyType: z.string().min(1, "Select agency type"),
    registrationNumber: z.string().trim().min(1, "Registration number is required"),
    establishedYear: z
        .string()
        .regex(/^\d{4}$/, "Enter a valid year")
        .refine(v => Number(v) >= 1900 && Number(v) <= new Date().getFullYear(), "Invalid year"),
    country: z.string().min(1, "Select country"),
    city: z.string().trim().min(1, "City is required"),
    website: z.string().trim().refine(v => v === "" || v.includes("."), "Enter a valid URL").or(z.literal("")),
})

/* =========================
   AGENT STEP 2 — Contact & Representative
========================= */

export const agentStep2Schema = z.object({
    contactPersonName: z.string().trim().min(2, "Contact person name is required"),
    designation: z.string().trim().min(1, "Designation is required"),
    contactEmail: z
        .string()
        .trim()
        .email("Invalid email")
        .transform(v => v.toLowerCase()),
    contactPhone: z
        .string()
        .trim()
        .regex(/^\+?\d{10,15}$/, "Invalid phone number"),
    alternatePhone: z
        .string()
        .trim()
        .regex(/^\+?\d{10,15}$/, "Invalid phone number")
        .or(z.literal("")),
    linkedIn: z.string().url("Enter a valid URL").or(z.literal("")),
})

/* =========================
   AGENT STEP 3 — Business Details
========================= */

export const agentStep3Schema = z.object({
    studentsRecruitedPerYear: z
        .string()
        .regex(/^\d+$/, "Must be a number")
        .refine(v => Number(v) >= 0, "Must be 0 or more"),
    targetCountries: z.string().trim().min(1, "Enter at least one target country"),
    partnerUniversities: z.string().trim(),
    servicesOffered: z.string().min(1, "Select a service"),
    hasSignedAgreement: z.enum(["yes", "no"], { message: "Please select an option" }),
    additionalNotes: z.string().max(500, "Max 500 characters"),
})



export const workExperienceSchema = z.object({
    academicGap: z
        .string()
        .trim()
        .regex(/^\d*$/, "Must be a number")
        .refine(v => v === "" || (Number(v) >= 0 && Number(v) <= 50), "Must be between 0 and 50")
        .default(""),
    hasExperience: z.enum(["yes", "no"], { message: "Please select an option" }),
    jobTitle: z.string(),
    organization: z.string(),
    industry: z.string(),
    country: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    responsibilities: z.string(),
}).superRefine((data, ctx) => {
    if (data.hasExperience === "yes") {
        if (!data.jobTitle?.trim()) ctx.addIssue({ path: ["jobTitle"], code: "custom", message: "Job title is required" })
        if (!data.organization?.trim()) ctx.addIssue({ path: ["organization"], code: "custom", message: "Organization is required" })
        if (!data.industry?.trim()) ctx.addIssue({ path: ["industry"], code: "custom", message: "Industry is required" })
        if (!data.country?.trim()) ctx.addIssue({ path: ["country"], code: "custom", message: "Country is required" })
        if (!data.startDate?.trim()) ctx.addIssue({ path: ["startDate"], code: "custom", message: "Start date is required" })
        if (!data.endDate?.trim()) ctx.addIssue({ path: ["endDate"], code: "custom", message: "End date is required" })
        if (!data.responsibilities?.trim()) ctx.addIssue({ path: ["responsibilities"], code: "custom", message: "Responsibilities are required" })
    }
})



export const profileStep1Schema = z.object({
    dob: z
        .string()
        .min(1, "DOB required")
        .refine((val) => !isNaN(Date.parse(val)), "Invalid date")
        .refine((val) => {
            const age =
                (Date.now() - new Date(val).getTime()) /
                (1000 * 60 * 60 * 24 * 365);
            return age >= 10 && age <= 100;
        }, "Invalid age"),

    gender: z.enum(Gender, {
        message: "Select gender",
    }),
    country: z
        .string()
        .min(1, "Country is Required")
        .min(2, "Country is Too Short")
        .max(200, "Maximum 200 character allowed"),
    guardianEmail: email,
    guardianPhone: phone,
    nationality: z
        .string()
        .min(1, "Nationality is Required")
        .min(4, "Nationality is Too Short")
        .max(200, "Maximum 200 character allowed"),
    passport_file_url: z
        .any()
        .refine((file) => file instanceof File, "File required")
        .refine((file) => !(file instanceof File) || file.size <= 5 * 1024 * 1024, "Max 5MB")
        .refine(
            (file) => !(file instanceof File) || ["application/pdf", "image/jpeg", "image/png"].includes(file.type),
            "Invalid file type"
        ),
});

/* =========================
   PROFILE (DB payloads - snake_case)
========================= */

export const studentProfileSchema = z.object({
    user_id: z.string().uuid(),
    avatar_url: z.string().url().optional(),
    date_of_birth: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE"]).optional(),
    country: z.string().min(1).max(200).optional(),
    nationality: z.string().min(1).max(200).optional(),
    guardian_email: email.optional(),
    guardian_phone: phone.optional(),
})

export const agentProfileSchema = z.object({
    agent_name: z.string().trim().min(2).optional(),
    contact_person_name: z.string().trim().min(2).optional(),
    gender: z.enum(["MALE", "FEMALE"]).optional(),
    country: z.string().trim().min(2).optional(),
    website: z.string().trim().optional(),
    experience_years: z.number().min(0).optional(),
    address: z.string().trim().min(5).optional(),
})

/* =========================
   DEGREE STEP 2
========================= */

export const degreeStep2Schema = z.object({
    highestDegree: z.string().min(1, "Select degree"),

    instituteName: z
        .string()
        .trim()
        .min(1, "Institute Name is Required")
        .min(2, "Institute Name is Too Short")
        .max(200, "Maximum 200 character allowed"),

    gpa: z
        .string()
        .trim()
        .regex(/^\d+(\.\d{1,2})?$/, "Invalid GPA")
        .refine((val) => {
            const num = parseFloat(val);
            return num >= 0 && num <= 4;
        }, "GPA must be between 0 and 4"),

    desiredProgram: z
        .string()
        .trim()
        .min(1, "Desired Program is required")
        .min(2, "Desired Program is Too Short")
        .max(200, "Maximum 200 character allowed"),

    campus: z.string().min(1, "Select campus"),
    englishTest: z.string().min(1, "Select test"),
    about: z
        .string()
        .trim()
        .min(1, "Plan is required")
        .min(10, "Too short")
        .max(500, "Too long"),
});