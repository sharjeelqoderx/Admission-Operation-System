import { useMutation, useQuery } from "@tanstack/react-query"
import { z } from "zod"
import { Enums, Tables, TablesUpdate } from "@/types/supabase"
import { loginSchema, otpSchema, signupSchema } from "@/types/schemas/auth"
import { ApiResponse } from "@/lib/api"

type RoleEnum = Enums<"role_enum">
type ProfileRow = Tables<"profile">
type ProfileUpdate = TablesUpdate<"profile">
type StudentRow = Tables<"student">
type StudentUpdate = TablesUpdate<"student">
type AgentRow = Tables<"agent">
type UniversityRow = Tables<"university">

type SignupPayload = z.infer<typeof signupSchema>
type LoginPayload = z.infer<typeof loginSchema>
type SendOtpPayload = { email: string }
type VerifyOtpPayload = { email: string; otp: z.infer<typeof otpSchema>["otp"] }

type StudentRoleProfile = {
    role: "STUDENT"
    details: StudentRow | null
}

type AgentRoleProfile = {
    role: "AGENT"
    details: AgentRow | null
}

type UniversityRoleProfile = {
    role: "UNIVERSITY"
    details: UniversityRow | null
}

type OtherRoleProfile = {
    role: Exclude<RoleEnum, "STUDENT" | "AGENT" | "UNIVERSITY">
    details: null
}

type RoleBasedProfile =
    | StudentRoleProfile
    | AgentRoleProfile
    | UniversityRoleProfile
    | OtherRoleProfile

type AuthUserResponse = {
    id: ProfileRow["id"]
    email: string
    fullName: string
    role: RoleEnum
    role_profile: RoleBasedProfile
    profile: {
        avatarUrl: NonNullable<ProfileRow["avatar_url"]> | ""
        dateOfBirth: NonNullable<ProfileRow["date_of_birth"]> | ""
        gender: NonNullable<ProfileRow["gender"]> | ""
        country: NonNullable<StudentRow["country"]> | ""
        nationality: NonNullable<StudentRow["nationality"]> | ""
        guardianEmail: NonNullable<StudentRow["guardian_email"]> | ""
        guardianPhone: NonNullable<StudentRow["guardian_phone"]> | ""
    }
    academic: {
        highestDegree: string
        instituteName: string
        gpa: string
        desiredProgram: string
        campus: string
        englishTest: string
        about: string
    } | null
    experience: {
        academicGap: string
        hasExperience: "yes"
        jobTitle: string
        organization: string
        industry: string
        country: string
        startDate: string
        endDate: string
        responsibilities: string
    } | null
    message?: string
}

type ProfilePayload = {
    user_id: ProfileRow["id"]
    avatar_url?: ProfileUpdate["avatar_url"]
    date_of_birth?: ProfileUpdate["date_of_birth"]
    gender?: ProfileUpdate["gender"]
    country?: StudentUpdate["country"]
    nationality?: StudentUpdate["nationality"]
    guardian_email?: StudentUpdate["guardian_email"]
    guardian_phone?: StudentUpdate["guardian_phone"]
}

type AcademicPayload = {
    userId: ProfileRow["id"]
    qualification: string
    instituteName: string
    gpa: number
    desiredProgram: string
    campus: string
    englishTest: string
    about: string
}

type ExperiencePayload = {
    userId: ProfileRow["id"]
    academicGap?: number
    hasExperience: "yes" | "no"
    name?: string
    organization?: string
    industry?: string
    country?: string
    startDate?: string
    endDate?: string
    responsibility?: string
}
type ProfileFormDataPayload = FormData
type AgentProfileFormDataPayload = FormData

async function post<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    })

    const data: ApiResponse<T> = await res.json()
    if (!data.success) throw new Error(data.error ?? "Request failed")
    return data.data
}

async function get<T>(url: string): Promise<T> {
    const res = await fetch(url, { cache: "no-store" })
    const data: ApiResponse<T> = await res.json()
    if (!data.success) throw new Error(data.error ?? "Request failed")
    return data.data
}

export function useAuth() {
    const login = useMutation({
        mutationFn: (payload: LoginPayload) =>
            post<AuthUserResponse>("/api/auth/login", payload),
    })
    const signup = useMutation({
        mutationFn: (payload: SignupPayload) =>
            post<AuthUserResponse>("/api/auth/signup", payload),
    })
    const logout = useMutation({
        mutationFn: () => post<{ message: string }>("/api/auth/logout", {}),
    })
    const sendOtp = useMutation({
        mutationFn: (payload: SendOtpPayload) =>
            post<{ message: string }>("/api/auth/send-otp", payload),
    })
    const verifyOtp = useMutation({
        mutationFn: (payload: VerifyOtpPayload) =>
            post<{ message: string }>("/api/auth/verify-otp", payload),
    })
    const me = useQuery({
        queryKey: ["me"],
        queryFn: () => get<AuthUserResponse>("/api/me"),
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: false,
    })
    const profile = useMutation({
        mutationFn: async (payload: ProfileFormDataPayload) => {
            const res = await fetch("/api/profile", {
                method: "POST",
                body: payload,
            })
            const raw = await res.text()
            if (!raw) throw new Error("Empty response from profile API")

            let data: ApiResponse<{ message: string }>
            try {
                data = JSON.parse(raw) as ApiResponse<{ message: string }>
            } catch {
                throw new Error(`Invalid response from profile API (${res.status})`)
            }

            if (!data.success) throw new Error(data.error ?? "Request failed")
            return data.data
        },
    })
    const academic = useMutation({
        mutationFn: (payload: AcademicPayload) =>
            post<{ message: string }>("/api/academic", payload),
    })
    const experience = useMutation({
        mutationFn: (payload: ExperiencePayload) =>
            post<{ message: string }>("/api/experience", payload),
    })
    const agentProfile = useMutation({
        mutationFn: async (payload: AgentProfileFormDataPayload) => {
            const res = await fetch("/api/agent/profile", {
                method: "POST",
                body: payload,
            })
            const data: ApiResponse<{ message: string }> = await res.json()
            if (!data.success) throw new Error(data.error ?? "Request failed")
            return data.data
        },
    })

    return {
        login,
        signup,
        logout,
        sendOtp,
        verifyOtp,
        me,
        profile,
        academic,
        experience,
        agentProfile,
    }
}