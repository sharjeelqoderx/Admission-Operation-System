import { formatFullName } from "@/lib/utils/profile"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import {
    resolveHighestQualificationName,
    resolveQualificationsById,
} from "@/lib/student/qualifications"

export type StudentListPagination = {
    total: number
    page: number
    limit: number
    totalPages: number
}

export type StudentListItem = {
    id: string
    profile_id: string
    student_code: string | null
    city: string | null
    state?: string | null
    country: string | null
    nationality: string | null
    aps_requirement?: boolean | null
    guardian_email: string | null
    guardian_phone: string | null
    created_at: string
    documents_uploaded_count?: number
    total_document_types?: number
    document_upload_percentage?: number
    highest_qualification: string | null
    profile: {
        id: string
        name: string | null
        email: string | null
        phone: string | null
        avatar_url: string | null
        gender: string | null
        date_of_birth: string | null
    } | null
}

export type StudentsListResult = {
    data: StudentListItem[]
    pagination: StudentListPagination
}

export type FetchStudentsListOptions = {
    q?: string
    status?: string
    page?: number
    limit?: number
}

export async function fetchStudentsListForAgent(
    supabase: SupabaseClient<Database>,
    userId: string,
    options: FetchStudentsListOptions = {}
): Promise<StudentsListResult | { error: string }> {
    const { data: agentRow } = await supabase
        .from("agent")
        .select("id")
        .eq("profile_id", userId)
        .maybeSingle()

    if (!agentRow) {
        return { error: "University Partner profile not found" }
    }

    const q = options.q ?? ""
    const status = options.status ?? "all"
    const page = options.page ?? 1
    const limit = options.limit ?? 10

    const { data: rawStudents, error } = await supabase
        .from("student")
        .select(`
            *,
            profile:profile_id (*)
        `)
        .eq("created_by_agent_id", agentRow.id)
        .order("created_at", { ascending: false })

    if (error) {
        return { error: "Failed to fetch students" }
    }

    let students = rawStudents ?? []
    const searchTerm = q.toLowerCase()
    const statusFilter = status.toLowerCase()

    students = students.filter((student) => {
        const studentStatus = (
            (student as { status?: string | null }).status || "CREATED"
        ).toLowerCase()
        if (statusFilter !== "all" && studentStatus !== statusFilter) {
            return false
        }

        if (!searchTerm) {
            return true
        }

        const studentCode = student.student_code?.toLowerCase() || ""
        const country = student.country?.toLowerCase() || ""
        const profileName = formatFullName(
            student.profile?.first_name,
            student.profile?.last_name
        ).toLowerCase()
        const profileEmail = student.profile?.email?.toLowerCase() || ""

        return (
            studentCode.includes(searchTerm) ||
            country.includes(searchTerm) ||
            profileName.includes(searchTerm) ||
            profileEmail.includes(searchTerm)
        )
    })

    const pagination: StudentListPagination = {
        total: students.length,
        page,
        limit,
        totalPages: students.length > 0 ? Math.max(1, Math.ceil(students.length / limit)) : 0,
    }

    const start = (page - 1) * limit
    students = students.slice(start, start + limit)

    if (students.length === 0) {
        return { data: [], pagination }
    }

    const profileIds = students.map((student) => student.profile_id)

    const [{ count: totalDocumentTypes }, { data: documents }, { data: educationRows }] =
        await Promise.all([
            supabase.from("document_type").select("id", { count: "exact", head: true }),
            supabase
                .from("document")
                .select("profile_id, document_type_id")
                .in("profile_id", profileIds)
                .not("document_type_id", "is", null),
            supabase.from("education").select("profile_id, qualification").in("profile_id", profileIds),
        ])

    const uploadedByProfile = new Map<string, Set<string>>()
    for (const doc of documents ?? []) {
        if (!doc.document_type_id) continue
        const existing = uploadedByProfile.get(doc.profile_id) ?? new Set<string>()
        existing.add(doc.document_type_id)
        uploadedByProfile.set(doc.profile_id, existing)
    }

    const educationByProfile = new Map<string, Array<{ qualification: string | null }>>()
    for (const row of educationRows ?? []) {
        const existing = educationByProfile.get(row.profile_id) ?? []
        existing.push({ qualification: row.qualification })
        educationByProfile.set(row.profile_id, existing)
    }

    const qualificationIds = [
        ...new Set(
            (educationRows ?? [])
                .map((row) => row.qualification)
                .filter((value): value is string => Boolean(value))
        ),
    ]

    const qualificationById = await resolveQualificationsById(supabase, qualificationIds)
    const total = totalDocumentTypes ?? 0

    const data: StudentListItem[] = students.map((student) => {
        const documentsUploadedCount = uploadedByProfile.get(student.profile_id)?.size ?? 0
        const documentUploadPercentage =
            total > 0 ? Math.round((documentsUploadedCount / total) * 100) : 0

        const profile = student.profile
            ? {
                ...student.profile,
                name: formatFullName(student.profile.first_name, student.profile.last_name),
            }
            : student.profile

        const highestQualification = resolveHighestQualificationName(
            educationByProfile.get(student.profile_id) ?? [],
            qualificationById
        )

        return {
            ...student,
            profile,
            documents_uploaded_count: documentsUploadedCount,
            total_document_types: total,
            document_upload_percentage: documentUploadPercentage,
            highest_qualification: highestQualification,
        }
    })

    return { data, pagination }
}

export type StudentDashboardStats = {
    total_students: number
    active_applications: number
    pending_actions: number
}

export async function fetchStudentDashboardStats(
    supabase: SupabaseClient<Database>,
    userId: string
): Promise<StudentDashboardStats | null> {
    const { data: agentRow } = await supabase
        .from("agent")
        .select("id")
        .eq("profile_id", userId)
        .maybeSingle()

    if (!agentRow) {
        return null
    }

    const [studentsResult, applicationsResult, pendingResult] = await Promise.all([
        supabase
            .from("student")
            .select("id", { count: "exact", head: true })
            .eq("created_by_agent_id", agentRow.id),
        supabase
            .from("application")
            .select("id", { count: "exact", head: true })
            .eq("submitted_by_profile_id", userId),
        supabase
            .from("application")
            .select("id", { count: "exact", head: true })
            .eq("submitted_by_profile_id", userId)
            .eq("status", "PENDING"),
    ])

    return {
        total_students: studentsResult.count ?? 0,
        active_applications: applicationsResult.count ?? 0,
        pending_actions: pendingResult.count ?? 0,
    }
}
