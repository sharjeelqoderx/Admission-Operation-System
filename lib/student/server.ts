import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { formatFullName } from "@/lib/utils/profile"
import {
    resolveQualificationsById,
} from "@/lib/student/qualifications"
import {
    fetchStudentDashboardStats,
    fetchStudentsListForAgent,
    type StudentDashboardStats,
    type StudentsListResult,
} from "@/lib/student/list"
import type { UserRole } from "@/types"

export type StudentFormPageData = {
    title?: string | null
    name?: string | null
    first_name?: string | null
    last_name?: string | null
    email?: string | null
    phone?: string | null
    date_of_birth?: string | null
    gender?: string | null
    avatar_url?: string | null
    student?: {
        country?: string | null
        state?: string | null
        city?: string | null
        nationality?: string | null
        guardian_email?: string | null
        guardian_phone?: string | null
        passport_file_url?: string | null
    } | null
    education?: Array<{
        id?: string | null
        qualification?: string | null
        institution_name?: string | null
        grade_type?: string | null
        gpa?: number | string | null
        obtained_marks?: number | string | null
        total_marks?: number | string | null
    }> | {
        id?: string | null
        qualification?: string | null
        institution_name?: string | null
        grade_type?: string | null
        gpa?: number | string | null
        obtained_marks?: number | string | null
        total_marks?: number | string | null
    } | null
}

export type StudentDashboardPageData = {
    stats: StudentDashboardStats
    students: StudentsListResult
    query: {
        q: string
        status: string
        page: string
    }
}

const DEFAULT_STUDENT_LIST_QUERY = {
    q: "",
    status: "all",
    page: "1",
} as const

export async function fetchStudentDashboardPageData(
    searchParams: {
        q?: string
        status?: string
        page?: string
    } = {}
): Promise<StudentDashboardPageData> {
    const supabase = await createSupabaseServerClient()
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    const emptyStats: StudentDashboardStats = {
        total_students: 0,
        active_applications: 0,
        pending_actions: 0,
    }

    const emptyStudents: StudentsListResult = {
        data: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
    }

    if (authError || !user) {
        return {
            stats: emptyStats,
            students: emptyStudents,
            query: {
                q: searchParams.q ?? DEFAULT_STUDENT_LIST_QUERY.q,
                status: searchParams.status ?? DEFAULT_STUDENT_LIST_QUERY.status,
                page: searchParams.page ?? DEFAULT_STUDENT_LIST_QUERY.page,
            },
        }
    }

    const q = searchParams.q ?? DEFAULT_STUDENT_LIST_QUERY.q
    const status = searchParams.status ?? DEFAULT_STUDENT_LIST_QUERY.status
    const page = searchParams.page ?? DEFAULT_STUDENT_LIST_QUERY.page

    const [stats, studentsResult] = await Promise.all([
        fetchStudentDashboardStats(supabase, user.id),
        fetchStudentsListForAgent(supabase, user.id, {
            q,
            status,
            page: parseInt(page, 10) || 1,
            limit: 10,
        }),
    ])

    return {
        stats: stats ?? emptyStats,
        students: "error" in studentsResult ? emptyStudents : studentsResult,
        query: { q, status, page },
    }
}

export type StudentFormCreatePageData = {
    user: {
        id: string
        role: UserRole
    } | null
}

export async function fetchStudentFormCreatePageData(): Promise<StudentFormCreatePageData> {
    const supabase = await createSupabaseServerClient()
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
        return { user: null }
    }

    const { data: profile } = await supabase
        .from("profile")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

    return {
        user: {
            id: user.id,
            role: (profile?.role ?? "STUDENT") as UserRole,
        },
    }
}

export async function fetchStudentForFormPage(
    studentId: string
): Promise<StudentFormPageData | null> {
    const supabase = await createSupabaseServerClient()
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
        return null
    }

    const { data: profile, error: profileError } = await supabase
        .from("profile")
        .select("*")
        .eq("id", studentId)
        .single()

    if (profileError || !profile) {
        return null
    }

    const { data: student } = await supabase
        .from("student")
        .select("*")
        .eq("profile_id", studentId)
        .maybeSingle()

    const { data: education } = await supabase
        .from("education")
        .select("*")
        .eq("profile_id", studentId)

    const qualificationIds = [
        ...new Set(
            (education ?? [])
                .map((row) => row.qualification)
                .filter((value): value is string => Boolean(value))
        ),
    ]

    const qualificationById = await resolveQualificationsById(supabase, qualificationIds)

    const enrichedEducation = (education ?? []).map((row) => ({
        ...row,
        qualification_degree: row.qualification
            ? qualificationById.get(row.qualification) ?? null
            : null,
    }))

    return {
        ...profile,
        name: formatFullName(profile.first_name, profile.last_name),
        student: student || null,
        education: enrichedEducation,
    }
}
