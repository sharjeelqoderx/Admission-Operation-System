import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { fetchOffersList } from "@/lib/offer/list"
import { OfferListQuerySchema } from "@/types/schemas/offer"
import type { OfferDashboardPageData, OfferListResponse } from "@/types/schemas/offer"

const DEFAULT_QUERY = {
    q: "",
    page: "1",
    limit: "10",
    status: "all",
    course_id: "all",
} as const

const EMPTY_OFFERS: OfferListResponse = {
    data: [],
    pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
    },
}

export async function fetchOfferDashboardPageData(
    searchParams: {
        q?: string
        page?: string
        limit?: string
        status?: string
        course_id?: string
    } = {}
): Promise<OfferDashboardPageData> {
    const query = {
        q: searchParams.q ?? DEFAULT_QUERY.q,
        page: searchParams.page ?? DEFAULT_QUERY.page,
        limit: searchParams.limit ?? DEFAULT_QUERY.limit,
        status: searchParams.status ?? DEFAULT_QUERY.status,
        course_id: searchParams.course_id ?? DEFAULT_QUERY.course_id,
    }

    const supabase = await createSupabaseServerClient()
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
        return { offers: EMPTY_OFFERS, query }
    }

    const { data: profile, error: profileError } = await supabase
        .from("profile")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

    if (profileError || !profile) {
        return { offers: EMPTY_OFFERS, query }
    }

    const parsed = OfferListQuerySchema.safeParse({
        q: query.q || undefined,
        page: query.page,
        limit: query.limit,
        status: query.status === "all" ? "all" : query.status,
        course_id: query.course_id !== "all" ? query.course_id : undefined,
    })

    if (!parsed.success) {
        return { offers: EMPTY_OFFERS, query }
    }

    try {
        const offers = await fetchOffersList({
            ...parsed.data,
            userId: user.id,
            role: profile.role,
        })

        return { offers, query }
    } catch {
        return { offers: EMPTY_OFFERS, query }
    }
}
