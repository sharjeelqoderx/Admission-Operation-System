import type { SupabaseClient } from "@supabase/supabase-js"
import {
    createSupabaseServerClient,
    createSupabaseServiceClient,
} from "@/lib/supabase/server"
import { withProfileDisplayName } from "@/lib/utils/profile"
import {
    isMissingOfferTemplateColumnError,
    OFFER_LIST_SELECT_LEGACY,
    OFFER_LIST_SELECT_WITH_TEMPLATE,
} from "@/lib/offer/select-fields"
import type {
    OfferListItem,
    OfferListQuery,
    OfferListResponse,
} from "@/types/schemas/offer"
import type { Database } from "@/types/supabase"
import { Role } from "@/types/enums/role"

type DbClient = SupabaseClient<Database>
type OfferRole = Role.STUDENT | Role.AGENT | Role.ADMIN | Role.SUPER_ADMIN

function matchesSearch(offer: OfferListItem, searchTerm: string) {
    if (!searchTerm) return true

    const haystack = [
        offer.application?.student?.name,
        offer.application?.student?.email,
        offer.application?.course?.name,
        offer.application?.course?.degree?.name,
        offer.application?.application_no,
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

    return haystack.includes(searchTerm)
}

function applyRoleFilter(offers: OfferListItem[], role: OfferRole, userId: string) {
    switch (role) {
        case Role.STUDENT:
            return offers.filter((offer) => offer.application?.profile_id === userId)
        case Role.ADMIN:
            return offers.filter((offer) => offer.application?.university_id === userId)
        case Role.AGENT:
        case Role.SUPER_ADMIN:
        default:
            return offers
    }
}

type RawOfferProfile = {
    id?: string
    first_name?: string | null
    last_name?: string | null
    avatar_url?: string | null
    email?: string | null
    name?: string | null
} | null

type RawOfferListItem = Omit<OfferListItem, "application"> & {
    application?: (Omit<NonNullable<OfferListItem["application"]>, "student" | "university"> & {
        student?: RawOfferProfile
        university?: RawOfferProfile
    }) | null
}

async function fetchRawOffers(client: DbClient): Promise<RawOfferListItem[]> {
    const primaryResult = await client
        .from("offer_letter")
        .select(OFFER_LIST_SELECT_WITH_TEMPLATE)
        .order("created_at", { ascending: false })

    const offersResult =
        primaryResult.error && isMissingOfferTemplateColumnError(primaryResult.error.message)
            ? await client
                  .from("offer_letter")
                  .select(OFFER_LIST_SELECT_LEGACY)
                  .order("created_at", { ascending: false })
            : primaryResult

    if (offersResult.error) {
        throw new Error(offersResult.error.message)
    }

    return (offersResult.data ?? []) as unknown as RawOfferListItem[]
}

function mapStudentForList(profile: RawOfferProfile): NonNullable<
    NonNullable<OfferListItem["application"]>["student"]
> | null {
    if (!profile?.id) return null
    const named = withProfileDisplayName(profile)
    return {
        id: profile.id,
        name: named?.name ?? null,
        avatar_url: profile.avatar_url ?? null,
        email: profile.email ?? null,
    }
}

function mapUniversityForList(profile: RawOfferProfile): NonNullable<
    NonNullable<OfferListItem["application"]>["university"]
> | null {
    if (!profile?.id) return null
    const named = withProfileDisplayName(profile)
    return {
        id: profile.id,
        name: named?.name ?? null,
    }
}

function mapOfferRows(offers: RawOfferListItem[]): OfferListItem[] {
    return offers.map((offer) => ({
        id: offer.id,
        status: offer.status,
        created_at: offer.created_at,
        application: offer.application
            ? {
                  id: offer.application.id,
                  application_no: offer.application.application_no,
                  profile_id: offer.application.profile_id,
                  submitted_by_profile_id: offer.application.submitted_by_profile_id,
                  university_id: offer.application.university_id,
                  student: mapStudentForList(offer.application.student ?? null),
                  university: mapUniversityForList(offer.application.university ?? null),
                  course: offer.application.course
                      ? {
                            id: offer.application.course.id,
                            name: offer.application.course.name,
                            degree: offer.application.course.degree
                                ? {
                                      id: offer.application.course.degree.id,
                                      name: offer.application.course.degree.name,
                                  }
                                : null,
                        }
                      : null,
              }
            : null,
    }))
}

export async function fetchOffersList(
    options: OfferListQuery & {
        userId: string
        role: OfferRole
    }
): Promise<OfferListResponse> {
    const page = options.page || 1
    const limit = options.limit || 10
    const searchTerm = (options.q ?? "").trim().toLowerCase()

    const userClient = await createSupabaseServerClient()
    const readClient =
        options.role === Role.STUDENT ? userClient : createSupabaseServiceClient()

    const mapped = mapOfferRows(await fetchRawOffers(readClient as DbClient))
    const roleFiltered = applyRoleFilter(mapped, options.role, options.userId)
    const filtered = roleFiltered.filter((offer) => matchesSearch(offer, searchTerm))

    const total = filtered.length
    const totalPages = Math.max(1, Math.ceil(total / limit))
    const safePage = Math.min(page, totalPages)
    const start = (safePage - 1) * limit

    return {
        data: filtered.slice(start, start + limit),
        pagination: {
            total,
            page: safePage,
            limit,
            totalPages: total === 0 ? 0 : totalPages,
        },
    }
}
