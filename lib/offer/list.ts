import type { SupabaseClient } from "@supabase/supabase-js"
import {
    createSupabaseServerClient,
    createSupabaseServiceClient,
} from "@/lib/supabase/server"
import { withProfileDisplayName } from "@/lib/utils/profile"
import type {
    OfferListItem,
    OfferListQuery,
    OfferListResponse,
} from "@/types/schemas/offer"
import type { Database } from "@/types/supabase"
import { isUniversityRole } from "@/lib/auth/university-role"
import { resolveUniversityApplicationScope } from "@/lib/auth/university-scope"
import { Role } from "@/types/enums/role"
import { rpcOffersList, toUniversityIdsParam } from "@/lib/rpc/dashboard"

type DbClient = SupabaseClient<Database>
type OfferRole = Role.STUDENT | Role.AGENT | Role.ADMIN | Role.MANAGEMENT | Role.SUPER_ADMIN

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

function mapStudentForList(profile: RawOfferProfile): NonNullable<
    NonNullable<OfferListItem["application"]>["student"]
> | null {
    if (!profile?.id) return null
    const named = withProfileDisplayName(profile)
    return {
        id: profile.id,
        name: profile.name ?? named?.name ?? null,
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
        name: profile.name ?? named?.name ?? null,
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

    const userClient = await createSupabaseServerClient()
    const readClient =
        options.role === Role.STUDENT ? userClient : createSupabaseServiceClient()

    const universityScope = isUniversityRole(options.role)
        ? await resolveUniversityApplicationScope(userClient, options.userId, options.role)
        : { universityIds: null }

    const rpcResult = await rpcOffersList(readClient as DbClient, {
        universityIds:
            options.role === Role.STUDENT
                ? null
                : isUniversityRole(options.role)
                  ? toUniversityIdsParam(universityScope)
                  : null,
        studentProfileId: options.role === Role.STUDENT ? options.userId : undefined,
        q: options.q,
        status: options.status,
        course_id: options.course_id,
        page,
        limit,
    })

    const mapped = mapOfferRows(rpcResult.data as RawOfferListItem[])

    return {
        data: mapped,
        pagination: rpcResult.pagination,
    }
}
