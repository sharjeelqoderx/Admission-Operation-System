import { formatFullName } from "@/lib/utils/profile"
import { createSupabaseServiceClient } from "@/lib/supabase/server"
import { rpcAgentStudentsList } from "@/lib/rpc/dashboard"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import {
    resolveHighestQualificationName,
    resolveQualificationsById,
} from "@/lib/student/qualifications"
import { Role } from "@/types/enums/role"

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
    const { data: profile } = await supabase
        .from("profile")
        .select("role")
        .eq("id", userId)
        .maybeSingle()

    if (profile?.role !== Role.AGENT && profile?.role !== Role.SUPER_ADMIN) {
        return { error: "Forbidden" }
    }

    const db = createSupabaseServiceClient()

    const q = options.q ?? ""
    const status = options.status ?? "all"
    const page = options.page ?? 1
    const limit = options.limit ?? 10

    let rpcResult
    try {
        rpcResult = await rpcAgentStudentsList(db, {
            q,
            status,
            page,
            limit,
        })
    } catch {
        return { error: "Failed to fetch students" }
    }

    if (rpcResult.data.length === 0) {
        return { data: [], pagination: rpcResult.pagination }
    }

    const qualificationIds = [
        ...new Set(
            rpcResult.data.flatMap((row) =>
                row.education_rows
                    .map((education) => education.qualification)
                    .filter((value): value is string => Boolean(value))
            )
        ),
    ]

    const qualificationById = await resolveQualificationsById(db, qualificationIds)
    const totalDocumentTypes = rpcResult.total_document_types

    const data: StudentListItem[] = rpcResult.data.map((row) => {
        const student = row.student as StudentListItem & {
            first_name?: string | null
            last_name?: string | null
            email?: string | null
            phone?: string | null
            avatar_url?: string | null
            gender?: string | null
            date_of_birth?: string | null
            profile_pk?: string
        }

        const documentsUploadedCount = row.documents_uploaded_count
        const documentUploadPercentage =
            totalDocumentTypes > 0
                ? Math.round((documentsUploadedCount / totalDocumentTypes) * 100)
                : 0

        const profile = {
            id: student.profile_id,
            name: formatFullName(student.first_name, student.last_name),
            email: student.email ?? null,
            phone: student.phone ?? null,
            avatar_url: student.avatar_url ?? null,
            gender: student.gender ?? null,
            date_of_birth: student.date_of_birth ?? null,
        }

        const highestQualification = resolveHighestQualificationName(
            row.education_rows,
            qualificationById
        )

        return {
            id: student.id,
            profile_id: student.profile_id,
            student_code: student.student_code ?? null,
            city: student.city ?? null,
            state: student.state ?? null,
            country: student.country ?? null,
            nationality: student.nationality ?? null,
            aps_requirement: student.aps_requirement ?? null,
            guardian_email: student.guardian_email ?? null,
            guardian_phone: student.guardian_phone ?? null,
            created_at: student.created_at,
            documents_uploaded_count: documentsUploadedCount,
            total_document_types: totalDocumentTypes,
            document_upload_percentage: documentUploadPercentage,
            highest_qualification: highestQualification,
            profile,
        }
    })

    return { data, pagination: rpcResult.pagination }
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
    const { data: profile } = await supabase
        .from("profile")
        .select("role")
        .eq("id", userId)
        .maybeSingle()

    if (profile?.role !== Role.AGENT && profile?.role !== Role.SUPER_ADMIN) {
        return null
    }

    const db = createSupabaseServiceClient()

    const [studentsResult, applicationsResult, pendingResult] = await Promise.all([
        db.from("student").select("id", { count: "exact", head: true }),
        db.from("application").select("id", { count: "exact", head: true }),
        db
            .from("application")
            .select("id", { count: "exact", head: true })
            .eq("status", "PENDING"),
    ])

    return {
        total_students: studentsResult.count ?? 0,
        active_applications: applicationsResult.count ?? 0,
        pending_actions: pendingResult.count ?? 0,
    }
}
