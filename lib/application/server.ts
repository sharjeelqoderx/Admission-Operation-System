import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { fetchApplicationsList } from "@/lib/application/list"
import { fetchApplicationDetail } from "@/lib/application/detail"
import { ApplicationListQuerySchema } from "@/types/schemas/application"
import type {
    ApplicationDashboardPageData,
    ApplicationDetail,
    ApplicationDetailPageData,
    ApplicationListResponse,
    ApplicationProfileRole,
} from "@/types/schemas/application"

const DEFAULT_APPLICATION_LIST_QUERY = {
    q: "",
    status: "all",
    degree_id: "all",
    date_from: "",
    date_to: "",
} as const

const EMPTY_APPLICATIONS: ApplicationListResponse = {
    data: [],
    stats: { total: 0, pending: 0, accepted: 0 },
    role: "AGENT",
}

export async function fetchApplicationDashboardPageData(
    searchParams: {
        q?: string
        status?: string
        degree_id?: string
        date_from?: string
        date_to?: string
    } = {}
): Promise<ApplicationDashboardPageData> {
    const supabase = await createSupabaseServerClient()
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    const query = {
        q: searchParams.q ?? DEFAULT_APPLICATION_LIST_QUERY.q,
        status: searchParams.status ?? DEFAULT_APPLICATION_LIST_QUERY.status,
        degree_id: searchParams.degree_id ?? DEFAULT_APPLICATION_LIST_QUERY.degree_id,
        date_from: searchParams.date_from ?? DEFAULT_APPLICATION_LIST_QUERY.date_from,
        date_to: searchParams.date_to ?? DEFAULT_APPLICATION_LIST_QUERY.date_to,
    }

    if (authError || !user) {
        return {
            applications: EMPTY_APPLICATIONS,
            query,
        }
    }

    const { data: profile, error: profileError } = await supabase
        .from("profile")
        .select("role")
        .eq("id", user.id)
        .single()

    if (profileError || !profile) {
        return {
            applications: EMPTY_APPLICATIONS,
            query,
        }
    }

    const role = profile.role as ApplicationProfileRole

    const queryParse = ApplicationListQuerySchema.safeParse({
        status: query.status !== "all" ? query.status : undefined,
        degree_id: query.degree_id !== "all" ? query.degree_id : undefined,
        date_from: query.date_from || undefined,
        date_to: query.date_to || undefined,
        q: query.q || undefined,
    })

    if (!queryParse.success) {
        return {
            applications: { ...EMPTY_APPLICATIONS, role },
            query,
        }
    }

    const result = await fetchApplicationsList(supabase, {
        ...queryParse.data,
        userId: user.id,
        role,
    })

    if ("error" in result) {
        return {
            applications: { ...EMPTY_APPLICATIONS, role },
            query,
        }
    }

    return {
        applications: result,
        query,
    }
}

export async function fetchApplicationDetailForPage(
    applicationId: string
): Promise<ApplicationDetailPageData> {
    const supabase = await createSupabaseServerClient()
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
        return {
            detail: null,
            error: "Unauthorized",
        }
    }

    const { data: profile, error: profileError } = await supabase
        .from("profile")
        .select("role")
        .eq("id", user.id)
        .single()

    if (profileError || !profile) {
        return {
            detail: null,
            error: "Profile not found",
        }
    }

    const result = await fetchApplicationDetail(supabase, {
        userId: user.id,
        role: profile.role as ApplicationProfileRole,
        applicationId,
    })

    if ("error" in result) {
        return {
            detail: null,
            error: result.error,
        }
    }

    return {
        detail: result,
        error: null,
    }
}
