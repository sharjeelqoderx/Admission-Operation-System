import { useMutation, useQuery } from "@tanstack/react-query"

interface SignupPayload {
    fullName: string
    email: string
    phone: string
    password: string
    role: string
}

async function post<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.error ?? "Request failed")
    return data.data
}

export function useLogin() {
    return useMutation({
        mutationFn: (payload: { email: string; password: string }) =>
            post<{ user: { id: string; email: string; fullName: string } }>("/api/auth/login", payload),
    })
}

export function useLogout() {
    return useMutation({
        mutationFn: () =>
            post<{ message: string }>("/api/auth/logout", {}),
    })
}

export function useSignup() {
    return useMutation({
        mutationFn: (payload: SignupPayload) =>
            post<{ message: string }>("/api/auth/signup", payload),
    })
}

async function get<T>(url: string): Promise<T> {
    const res = await fetch(url, { cache: "no-store" })
    const data = await res.json()
    if (!data.success) throw new Error(data.error ?? "Request failed")
    return data.data
}

export function useMe() {
    return useQuery({
        queryKey: ["me"],
        queryFn: () => get<{
            id: string
            email: string
            fullName: string
            role: string
            profile: { dateOfBirth: string; gender: string; country: string; nationality: string; guardianEmail: string; guardianPhone: string }
            academic: { highestDegree: string; instituteName: string; gpa: string; desiredProgram: string; campus: string; englishTest: string; about: string } | null
            experience: { academicGap: string; hasExperience: "yes"; jobTitle: string; organization: string; industry: string; country: string; startDate: string; endDate: string; responsibilities: string } | null
        }>("/api/me"),
    })
}

export function useProfile() {
    return useMutation({
        mutationFn: (payload: Record<string, unknown>) =>
            post<{ message: string }>("/api/profile", payload),
    })
}

export function useAcademic() {
    return useMutation({
        mutationFn: (payload: Record<string, unknown>) =>
            post<{ message: string }>("/api/academic", payload),
    })
}

export function useExperience() {
    return useMutation({
        mutationFn: (payload: Record<string, unknown>) =>
            post<{ message: string }>("/api/experience", payload),
    })
}
