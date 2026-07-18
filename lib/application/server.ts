import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { fetchApplicationsList } from "@/lib/application/list"
import { fetchApplicationDetail } from "@/lib/application/detail"
import { ApplicationListQuerySchema } from "@/types/schemas/application"
import type {
    ApplicationDashboardPageData,
    ApplicationDetailPageData,
    ApplicationListResponse,
    ApplicationProfileRole,
} from "@/types/schemas/application"
import { Role } from "@/types/enums/role"

const DEFAULT_APPLICATION_LIST_QUERY = {
    q: "",
    status: "all",
    degree_id: "all",
    date_from: "",
    date_to: "",
    page: "1",
    limit: "10",
} as const

const EMPTY_APPLICATIONS: ApplicationListResponse = {
    data: [],
    stats: { total: 0, pending: 0, accepted: 0 },
    role: Role.AGENT,
    pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
    },
}

function buildQuery(searchParams: {
    q?: string
    status?: string
    degree_id?: string
    date_from?: string
    date_to?: string
    page?: string
    limit?: string
}) {
    return {
        q: searchParams.q ?? DEFAULT_APPLICATION_LIST_QUERY.q,
        status: searchParams.status ?? DEFAULT_APPLICATION_LIST_QUERY.status,
        degree_id: searchParams.degree_id ?? DEFAULT_APPLICATION_LIST_QUERY.degree_id,
        date_from: searchParams.date_from ?? DEFAULT_APPLICATION_LIST_QUERY.date_from,
        date_to: searchParams.date_to ?? DEFAULT_APPLICATION_LIST_QUERY.date_to,
        page: searchParams.page ?? DEFAULT_APPLICATION_LIST_QUERY.page,
        limit: searchParams.limit ?? DEFAULT_APPLICATION_LIST_QUERY.limit,
    }
}

export async function fetchApplicationDashboardPageData(
    searchParams: {
        q?: string
        status?: string
        degree_id?: string
        date_from?: string
        date_to?: string
        page?: string
        limit?: string
    } = {},
    options: { scope?: "all"; paginate?: boolean } = {}
): Promise<ApplicationDashboardPageData> {
    const supabase = await createSupabaseServerClient()
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    const query = buildQuery(searchParams)
    const paginate = options.paginate === true || options.scope === "all"

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
        page: paginate ? query.page : undefined,
        limit: paginate ? query.limit : undefined,
        scope: options.scope,
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

export async function fetchAllApplicationViewPageData(
    searchParams: {
        q?: string
        status?: string
        degree_id?: string
        date_from?: string
        date_to?: string
        page?: string
        limit?: string
    } = {}
): Promise<ApplicationDashboardPageData> {
    return fetchApplicationDashboardPageData(searchParams, {
        scope: "all",
        paginate: true,
    })
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
