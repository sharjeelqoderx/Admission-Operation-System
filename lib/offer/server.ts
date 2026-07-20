import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { fetchOffersList } from "@/lib/offer/list"
import { OfferListQuerySchema } from "@/types/schemas/offer"
import type { OfferDashboardPageData, OfferListResponse } from "@/types/schemas/offer"

const DEFAULT_QUERY = {
    q: "",
    page: "1",
    limit: "10",
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
    } = {}
): Promise<OfferDashboardPageData> {
    const query = {
        q: searchParams.q ?? DEFAULT_QUERY.q,
        page: searchParams.page ?? DEFAULT_QUERY.page,
        limit: searchParams.limit ?? DEFAULT_QUERY.limit,
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
