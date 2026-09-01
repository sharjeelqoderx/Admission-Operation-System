import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { clearSessionQueryCache } from "@/lib/query/session-cache"
import { setSessionActive, syncSessionActiveFromCookie } from "@/lib/auth/client-session"
import { useClientReady } from "@/hooks/useClientReady"
import { z } from "zod"
import { Enums, Tables, TablesUpdate } from "@/types/supabase"
import { loginSchema, otpSchema, signupSchema } from "@/types/schemas/auth"
import { ApiResponse } from "@/lib/api"
import { Role } from "@/types/enums/role"
import { invalidateQualificationDocumentQueries } from "@/lib/utils/qualification-upgrade"

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
    role: Role.STUDENT
    details: StudentRow | null
}

type AgentRoleProfile = {
    role: Role.AGENT
    details: AgentRow | null
}

type UniversityRoleProfile = {
    role: Role.ADMIN | Role.MANAGEMENT
    details: UniversityRow | null
}

type OtherRoleProfile = {
    role: Exclude<RoleEnum, Role.STUDENT | Role.AGENT | Role.ADMIN | Role.MANAGEMENT>
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
    firstName: NonNullable<ProfileRow["first_name"]> | ""
    lastName: NonNullable<ProfileRow["last_name"]> | ""
    title: NonNullable<ProfileRow["title"]> | ""
    phone: NonNullable<ProfileRow["phone"]> | ""
    role: RoleEnum
    avatarUrl: NonNullable<ProfileRow["avatar_url"]> | ""
    role_profile: RoleBasedProfile
    profile: {
        dateOfBirth: NonNullable<ProfileRow["date_of_birth"]> | ""
        gender: NonNullable<ProfileRow["gender"]> | ""
        country: NonNullable<StudentRow["country"]> | ""
        state: NonNullable<StudentRow["state"]> | ""
        city: NonNullable<StudentRow["city"]> | ""
        nationality: NonNullable<StudentRow["nationality"]> | ""
        guardianEmail: NonNullable<StudentRow["guardian_email"]> | ""
        guardianPhone: NonNullable<StudentRow["guardian_phone"]> | ""
        street_1: NonNullable<StudentRow["street_1"]> | ""
        street_2: NonNullable<StudentRow["street_2"]> | ""
        street_3: NonNullable<StudentRow["street_3"]> | ""
        post_code: NonNullable<StudentRow["post_code"]> | ""
        address: NonNullable<StudentRow["address"]> | ""
        zip_code: NonNullable<StudentRow["zip_code"]> | ""
        website: NonNullable<AgentRow["website"]> | ""
        other_contact_number: NonNullable<AgentRow["other_contact_number"]> | ""
        experience_years: AgentRow["experience_years"] | null
        contact_person_first_name: NonNullable<AgentRow["contact_person_first_name"]> | ""
        contact_person_last_name: NonNullable<AgentRow["contact_person_last_name"]> | ""
    }

    academic: Array<{
        qualification: string
        instituteName: string
        grade_type?: string | null
        gpa?: string
        obtained_marks: string
        total_marks: string
        start_date: string
        end_date: string
        about: string
    }> | null
    experience: {
        hasExperience: "yes"
        entries: Array<{
            jobTitle: string
            organization: string
            industry: string
            country: string
            startDate: string
            endDate: string
            responsibilities: string
        }>
    } | null
    agentKyc?: {
        registrationCertificateUrl: string | null
        idCardFrontUrl: string | null
        idCardBackUrl: string | null
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
    academics: Array<{
        qualification: string
        instituteName: string
        grade_type: "percentage" | "gpa"
        gpa: number | null
        obtained_marks: number | null
        total_marks: number | null
        start_date?: string
        end_date?: string
        about?: string
    }>
}

type ExperiencePayload = {
    userId: ProfileRow["id"]
    hasExperience: "yes" | "no"
    experiences: Array<{
        name?: string
        organization?: string
        industry?: string
        country?: string
        startDate?: string
        endDate?: string
        responsibility?: string
    }>
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
    const res = await fetch(url)
    const data: ApiResponse<T> = await res.json()
    if (!data.success) throw new Error(data.error ?? "Request failed")
    return data.data
}

export function useAuth() {
    const queryClient = useQueryClient()
    const clientReady = useClientReady()
    const sessionActive = clientReady ? syncSessionActiveFromCookie() : false

    const login = useMutation({
        mutationFn: (payload: LoginPayload) =>
            post<AuthUserResponse>("/api/auth/login", payload),
        onSuccess: () => {
            setSessionActive(true)
            clearSessionQueryCache(queryClient)
        },
    })
    const signup = useMutation({
        mutationFn: (payload: SignupPayload) =>
            post<AuthUserResponse>("/api/auth/signup", payload),
        onSuccess: () => {
            setSessionActive(true)
            clearSessionQueryCache(queryClient)
        },
    })
    const logout = useMutation({
        mutationFn: () => post<{ message: string }>("/api/auth/logout", {}),
        onMutate: () => {
            setSessionActive(false)
            queryClient.cancelQueries({ queryKey: ["me"] })
        },
        onSuccess: () => {
            clearSessionQueryCache(queryClient)
        },
    })
    const sendOtp = useMutation({
        mutationFn: (payload: SendOtpPayload) =>
            post<{ message: string }>("/api/auth/send-otp", payload),
    })
    const verifyOtp = useMutation({
        mutationFn: (payload: VerifyOtpPayload) =>
            post<{ message: string }>("/api/auth/verify-otp", payload),
        onSuccess: () => {
            setSessionActive(true)
            clearSessionQueryCache(queryClient)
        },
    })
    const me = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            try {
                return await get<AuthUserResponse>("/api/me")
            } catch (error) {
                setSessionActive(false)
                throw error
            }
        },
        enabled: clientReady && sessionActive,
        // Keep current user warm — logout/login already clearSessionQueryCache().
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["me"] })
        },
    })
    const academic = useMutation({
        mutationFn: (payload: AcademicPayload) =>
            post<{ message: string }>("/api/academic", payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["me"] })
            invalidateQualificationDocumentQueries(queryClient, variables.userId)
        },
    })
    const experience = useMutation({
        mutationFn: (payload: ExperiencePayload) =>
            post<{ message: string }>("/api/experience", payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["me"] })
        },
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["me"] })
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