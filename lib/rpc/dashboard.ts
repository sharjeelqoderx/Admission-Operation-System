import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import type { UniversityApplicationScope } from "@/lib/auth/university-scope"

type RpcClient = SupabaseClient<Database>

export function toUniversityIdsParam(
    scope?: UniversityApplicationScope | null,
    singleUniversityId?: string | null
): string[] | null {
    if (scope?.universityIds !== undefined) {
        return scope.universityIds
    }

    if (singleUniversityId) {
        return [singleUniversityId]
    }

    return null
}

export async function rpcUniversityStudentsList(
    supabase: RpcClient,
    params: {
        universityIds?: string[] | null
        q?: string
        status?: string
        page?: number
        limit?: number
    }
) {
    const { data, error } = await supabase.rpc("fetch_university_students_list", {
        p_university_ids: params.universityIds ?? undefined,
        p_search: params.q ?? "",
        p_status: params.status ?? "all",
        p_page: params.page ?? 1,
        p_limit: params.limit ?? 10,
    })

    if (error) {
        throw new Error(error.message)
    }

    return data as {
        stats: {
            total_students: number
            applied: number
            enrolled: number
        }
        data: Array<{
            profile_id: string
            name: string
            student_code: string | null
            program_name: string | null
            intake_label: string | null
            applied_through: "Direct" | "University Partner"
            pipeline_status: string
            submission_date: string | null
        }>
        pagination: {
            total: number
            page: number
            limit: number
            totalPages: number
        }
    }
}

export async function rpcUniversityApplicationsList(
    supabase: RpcClient,
    params: {
        universityIds?: string[] | null
        q?: string
        tab?: string
        page?: number
        limit?: number
    }
) {
    const { data, error } = await supabase.rpc("fetch_university_applications_list", {
        p_university_ids: params.universityIds ?? undefined,
        p_search: params.q ?? "",
        p_tab: params.tab ?? "all",
        p_page: params.page ?? 1,
        p_limit: params.limit ?? 10,
    })

    if (error) {
        throw new Error(error.message)
    }

    return data as {
        tab_counts: {
            all: number
            pending_review: number
            awaiting_signature: number
            recently_completed: number
            rejected: number
            defer_intake: number
        }
        data: Array<{
            id: string
            student_name: string
            student_code: string | null
            avatar_url: string | null
            course_name: string | null
            intake_label: string | null
            agent_name: string
            pipeline_status: string
            submission_date: string | null
            is_deferred: boolean
            custom_intake_date: string | null
            app_status: string
            has_offer: boolean
        }>
        pagination: {
            total: number
            page: number
            limit: number
            totalPages: number
        }
    }
}

export async function rpcUniversityProgramsList(
    supabase: RpcClient,
    params: {
        universityIds?: string[] | null
        q?: string
        level_id?: string
        page?: number
        limit?: number
    }
) {
    const { data, error } = await supabase.rpc("fetch_university_programs_list", {
        p_university_ids: params.universityIds ?? undefined,
        p_search: params.q ?? "",
        p_level_id: params.level_id ?? undefined,
        p_page: params.page ?? 1,
        p_limit: params.limit ?? 10,
    })

    if (error) {
        throw new Error(error.message)
    }

    return data as {
        data: Array<{
            id: string
            name: string
            category: string | null
            level_name: string | null
            intake_label: string | null
            deadline_label: string
            location: string | null
            duration: string | null
            tuition_fees: string | null
            agent_commission: number | null
            created_at: string
            updated_at: string
        }>
        pagination: {
            total: number
            page: number
            limit: number
            totalPages: number
        }
    }
}

export async function rpcAgentStudentsList(
    supabase: RpcClient,
    params: {
        q?: string
        status?: string
        page?: number
        limit?: number
    }
) {
    const { data, error } = await supabase.rpc("fetch_agent_students_list", {
        p_search: params.q ?? "",
        p_status: params.status ?? "all",
        p_page: params.page ?? 1,
        p_limit: params.limit ?? 10,
    })

    if (error) {
        throw new Error(error.message)
    }

    return data as {
        data: Array<{
            student: Record<string, unknown>
            documents_uploaded_count: number
            total_document_types: number
            education_rows: Array<{ qualification: string | null }>
        }>
        pagination: {
            total: number
            page: number
            limit: number
            totalPages: number
        }
        total_document_types: number
    }
}

export async function rpcOffersList(
    supabase: RpcClient,
    params: {
        universityIds?: string[] | null
        studentProfileId?: string
        q?: string
        status?: string
        course_id?: string
        page?: number
        limit?: number
    }
) {
    const { data, error } = await supabase.rpc("fetch_offers_list", {
        p_university_ids: params.universityIds ?? undefined,
        p_student_profile_id: params.studentProfileId ?? undefined,
        p_search: params.q ?? "",
        p_status: params.status ?? "all",
        p_course_id: params.course_id ?? undefined,
        p_page: params.page ?? 1,
        p_limit: params.limit ?? 10,
    })

    if (error) {
        throw new Error(error.message)
    }

    return data as {
        data: Array<{
            id: string
            status: string
            created_at: string
            application: Record<string, unknown> | null
        }>
        pagination: {
            total: number
            page: number
            limit: number
            totalPages: number
        }
    }
}

export async function rpcUniversityOverview(
    supabase: RpcClient,
    params: {
        universityIds?: string[] | null
    }
) {
    const { data, error } = await supabase.rpc("fetch_university_overview", {
        p_university_ids: params.universityIds ?? undefined,
    })

    if (error) {
        throw new Error(error.message)
    }

    return data as {
        stats: {
            total_students: number
            total_university_partners: number
            active_applications: number
            total_applications: number
            templates: number
            programs: number
            total_documents: number
            total_offers: number
        }
        application_status_counts: Record<string, number>
        pipeline_status_counts: Record<string, number>
        offer_status_counts: Record<string, number>
        program_status_counts: Record<string, number>
        document_status_counts: Record<string, number>
        monthly_trend: Array<{
            month: string
            applications: number
            offers: number
        }>
        recent: {
            students: Array<{
                profile_id: string
                name: string
                program_name: string | null
                pipeline_status: string
                submission_date: string | null
            }>
            applications: Array<{
                id: string
                student_name: string
                program_name: string | null
                pipeline_status: string
                submission_date: string | null
            }>
            programs: Array<{
                id: string
                name: string
                category: string | null
                status: string
            }>
            templates: Array<{
                id: string
                title: string
                updated_at: string
            }>
            documents: Array<{
                id: string
                student_name: string
                document_type: string | null
                status: string | null
                created_at: string | null
            }>
            offers: Array<{
                id: string
                student_name: string
                program_name: string | null
                status: string
                created_at: string | null
            }>
        }
    }
}

export async function rpcDocumentStudentsList(
    supabase: RpcClient,
    params: {
        profileIds?: string[] | null
        agentId?: string
        search?: string
        status?: string
        page?: number
        limit?: number
    }
) {
    const { data, error } = await supabase.rpc("fetch_document_students_list", {
        p_profile_ids: params.profileIds ?? undefined,
        p_agent_id: params.agentId ?? undefined,
        p_search: params.search ?? "",
        p_status: params.status ?? "all",
        p_page: params.page ?? 1,
        p_limit: params.limit ?? 10,
    })

    if (error) {
        throw new Error(error.message)
    }

    return data as {
        data: Array<{
            student_id: string
            student_name: string
            student_code: string | null
            avatar_url: string | null
            document_count: number
            last_uploaded_at: string | null
            last_doc_status: string | null
        }>
        pagination: {
            total: number
            page: number
            limit: number
            totalPages: number
        }
    }
}
