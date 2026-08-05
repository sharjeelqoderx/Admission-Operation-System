import { z } from "zod";
import { Gender } from "..";
import { fileWithinSizeLimit, MAX_FILE_SIZE_LABEL } from "@/lib/constants/file-upload";
import { Role } from "@/types/enums/role";
import { AddressFieldsSchema } from "@/types/schemas/address";

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
    .regex(/^\+?[\d\s\-\(\)]{8,30}$/, "Invalid phone number");

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
    title: z.string().default(""),
    firstName: z
        .string()
        .trim()
        .min(1, "First Name is Required")
        .min(2, "First Name is Too Short")
        .regex(/^[a-zA-Z]+$/, "Only letters allowed"),
    lastName: z
        .string()
        .trim()
        .min(1, "Last Name is Required")
        .min(2, "Last Name is Too Short")
        .regex(/^[a-zA-Z]+$/, "Only letters allowed"),
    email,
    phone,
    password,
    role: z.enum([Role.AGENT, Role.STUDENT]).default(Role.STUDENT),
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
    experiences: z.array(z.object({
        jobTitle: z.string(),
        organization: z.string(),
        industry: z.string(),
        country: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        responsibilities: z.string(),
    })).optional()
}).superRefine((data, ctx) => {
    if (data.hasExperience === "yes" && data.experiences) {
        data.experiences.forEach((exp, i) => {
            if (!exp.jobTitle?.trim()) ctx.addIssue({ path: ["experiences", i, "jobTitle"], code: "custom", message: "Job title is required" })
            if (!exp.organization?.trim()) ctx.addIssue({ path: ["experiences", i, "organization"], code: "custom", message: "Organization is required" })
            if (!exp.industry?.trim()) ctx.addIssue({ path: ["experiences", i, "industry"], code: "custom", message: "Industry is required" })
            if (!exp.country?.trim()) ctx.addIssue({ path: ["experiences", i, "country"], code: "custom", message: "Country is required" })
            if (!exp.startDate?.trim()) ctx.addIssue({ path: ["experiences", i, "startDate"], code: "custom", message: "Start date is required" })
            if (!exp.endDate?.trim()) ctx.addIssue({ path: ["experiences", i, "endDate"], code: "custom", message: "End date is required" })
            if (!exp.responsibilities?.trim()) ctx.addIssue({ path: ["experiences", i, "responsibilities"], code: "custom", message: "Responsibilities are required" })
        })
    }
})

export const experienceFormItemSchema = z.object({
    name: z.string(),
    organization: z.string(),
    industry: z.string(),
    country: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    responsibility: z.string(),
})

export const onboardingExperienceStepSchema = z.object({
    experiences: z.array(experienceFormItemSchema).min(1, "At least one experience is required"),
}).superRefine((data, ctx) => {
    data.experiences.forEach((exp, i) => {
        if (!exp.name?.trim()) {
            ctx.addIssue({ path: ["experiences", i, "name"], code: "custom", message: "Job title is required" })
        }
        if (!exp.organization?.trim()) {
            ctx.addIssue({ path: ["experiences", i, "organization"], code: "custom", message: "Organization is required" })
        }
        if (!exp.industry?.trim()) {
            ctx.addIssue({ path: ["experiences", i, "industry"], code: "custom", message: "Industry is required" })
        }
        if (!exp.country?.trim()) {
            ctx.addIssue({ path: ["experiences", i, "country"], code: "custom", message: "Country is required" })
        }
        if (!exp.startDate?.trim()) {
            ctx.addIssue({ path: ["experiences", i, "startDate"], code: "custom", message: "Start date is required" })
        }
        if (!exp.endDate?.trim()) {
            ctx.addIssue({ path: ["experiences", i, "endDate"], code: "custom", message: "End date is required" })
        }
        if (!exp.responsibility?.trim()) {
            ctx.addIssue({ path: ["experiences", i, "responsibility"], code: "custom", message: "Responsibilities are required" })
        }
    })
})

export type ExperienceFormItem = z.infer<typeof experienceFormItemSchema>

export function createEmptyExperienceItem(): ExperienceFormItem {
    return {
        name: "",
        organization: "",
        industry: "",
        country: "",
        startDate: "",
        endDate: "",
        responsibility: "",
    }
}



export const profileStep1Schema = z.object({
    dob: z
        .string()
        .min(1, "Date of birth is required")
        .refine((val) => !isNaN(Date.parse(val)), "Invalid date")
        .refine((val) => {
            const age =
                (Date.now() - new Date(val).getTime()) /
                (1000 * 60 * 60 * 24 * 365);
            return age >= 10 && age <= 100;
        }, "Invalid age"),

    gender: z.nativeEnum(Gender, {
        message: "Select gender",
    }),
    country: z
        .string()
        .min(1, "Country is required")
        .min(2, "Country name is too short"),
    state: z
        .string()
        .min(1, "State is required")
        .min(2, "State is too short"),
    city: z
        .string()
        .min(1, "City is required")
        .min(2, "City is too short"),
    nationality: z
        .string()
        .min(1, "Nationality is required")
        .min(2, "Nationality is too short"),
    street_1: AddressFieldsSchema.shape.street_1,
    street_2: AddressFieldsSchema.shape.street_2,
    street_3: AddressFieldsSchema.shape.street_3,
    post_code: AddressFieldsSchema.shape.post_code,
    guardianEmail: z.union([
        z.literal(""),
        z.string().trim().email("Invalid guardian email format"),
    ]),
    guardianPhone: z.union([
        z.literal(""),
        z
            .string()
            .trim()
            .regex(/^\+?[\d\s\-()]{8,30}$/, "Invalid guardian phone number"),
    ]),
    avatar_url: z
        .any()
        .refine((val) => val instanceof File || (typeof val === 'string' && val.length > 0), "Profile picture is required")
        .refine(fileWithinSizeLimit, `Max file size is ${MAX_FILE_SIZE_LABEL}`)
        .refine(
            (val) => typeof val === 'string' || (val instanceof File && ["image/jpeg", "image/png", "image/webp"].includes(val.type)),
            "Only JPEG, PNG or WEBP images are allowed"
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
    first_name: z.string().trim().min(2).optional(),
    last_name: z.string().trim().min(2).optional(),
    title: z.enum(["Mr", "Mrs", "Ms"]).optional(),
    agent_name: z.string().trim().min(2).optional(),
    contact_person_name: z.string().trim().min(2).optional(),
    contact_person_first_name: z.string().trim().min(2).optional(),
    contact_person_last_name: z.string().trim().min(2).optional(),
    gender: z.enum(["MALE", "FEMALE"]).optional(),
    country: z.string().trim().min(2).optional(),
    state: z.string().trim().min(2).optional(),
    city: z.string().trim().min(2).optional(),
    website: z.string().trim().optional(),
    experience_years: z.number().min(0).optional(),
    street_1: z.string().trim().min(1).optional(),
    street_2: z.string().trim().optional(),
    street_3: z.string().trim().optional(),
    post_code: z.string().trim().optional(),
    other_contact_number: z.string().trim().optional(),
})

/* =========================
   DEGREE STEP 2
========================= */

export const degreeStep2Schema = z.object({
    academics: z.array(z.object({
        qualification: z.string().uuid("Select degree"),

        instituteName: z
            .string()
            .trim()
            .min(1, "Institute Name is Required")
            .min(2, "Institute Name is Too Short")
            .max(200, "Maximum 200 character allowed"),

        grade_type: z.enum(["percentage", "gpa"]),

        gpa: z.string(),

        obtained_marks: z.string(),

        total_marks: z.string(),
    }).superRefine((val, ctx) => {
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
    })).min(1, "At least one academic record is required")
}).superRefine((data, ctx) => {
    const ids = data.academics.map(a => a.qualification).filter(Boolean)
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i)
    if (duplicates.length > 0) {
        data.academics.forEach((a, i) => {
            if (duplicates.includes(a.qualification)) {
                ctx.addIssue({
                    path: ["academics", i, "qualification"],
                    code: "custom",
                    message: "This degree is already selected",
                })
            }
        })
    }
});