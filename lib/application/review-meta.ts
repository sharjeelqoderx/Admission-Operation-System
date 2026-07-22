import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import { tryCreateSupabaseServiceClient } from "@/lib/supabase/server"
import {
    buildApplicationRejectionHistory,
    buildApplicationReviewHistory,
} from "@/lib/application/review-history"
import {
    assertCanResubmitApplication,
    canRejectApplication,
} from "@/lib/application/review-access"
import type { ApplicationReviewHistoryEntry } from "@/types/schemas/application"

const APPLICATION_REVIEW_SELECT = `
    id,
    application_id,
    status,
    feedback,
    created_at,
    updated_at,
    reviewed_by_profile_id,
    reviewed_by:reviewed_by_profile_id (
        id,
        first_name,
        last_name
    )
`

export async function loadRejectionHistoryByApplicationIds(
    supabase: SupabaseClient<Database>,
    applicationIds: string[]
): Promise<Map<string, ApplicationReviewHistoryEntry[]>> {
    const result = new Map<string, ApplicationReviewHistoryEntry[]>()

    if (applicationIds.length === 0) {
        return result
    }

    const { data: reviews } = await supabase
        .from("application_review")
        .select(APPLICATION_REVIEW_SELECT)
        .in("application_id", applicationIds)
        .order("created_at", { ascending: false })

    const reviewsByApplicationId = new Map<string, NonNullable<typeof reviews>>()

    for (const review of reviews ?? []) {
        const applicationId = review.application_id
        const existing = reviewsByApplicationId.get(applicationId) ?? []
        existing.push(review)
        reviewsByApplicationId.set(applicationId, existing)
    }

    for (const [applicationId, applicationReviews] of reviewsByApplicationId) {
        const reviewHistory = buildApplicationReviewHistory(applicationReviews)
        result.set(applicationId, buildApplicationRejectionHistory(reviewHistory))
    }

    return result
}

export async function loadApplicationReviewMeta(
    supabase: SupabaseClient<Database>,
    params: {
        applicationId: string
        applicationStatus: string
        hasOffer: boolean
        profileId: string
        submittedByProfileId: string | null
        viewerId: string
        viewerRole: string | null | undefined
    }
): Promise<{
    review_history: ApplicationReviewHistoryEntry[]
    rejection_history: ApplicationReviewHistoryEntry[]
    can_reject: boolean
    can_resubmit: boolean
}> {
    const { data: reviews } = await supabase
        .from("application_review")
        .select(APPLICATION_REVIEW_SELECT)
        .eq("application_id", params.applicationId)
        .order("created_at", { ascending: false })

    const reviewHistory = buildApplicationReviewHistory(reviews ?? [])
    const rejectionHistory = buildApplicationRejectionHistory(reviewHistory)

    const canResubmit = await assertCanResubmitApplication(
        supabase,
        params.viewerId,
        {
            id: params.applicationId,
            status: params.applicationStatus,
            profile_id: params.profileId,
            submitted_by_profile_id: params.submittedByProfileId,
        },
        params.viewerRole
    )

    return {
        review_history: reviewHistory,
        rejection_history: rejectionHistory,
        can_reject: canRejectApplication({
            role: params.viewerRole,
            applicationStatus: params.applicationStatus,
            hasOffer: params.hasOffer,
        }),
        can_resubmit: canResubmit,
    }
}

export async function recordApplicationResubmit(
    supabase: SupabaseClient<Database>,
    params: {
        applicationId: string
        reviewedByProfileId: string
    }
) {
    const now = new Date().toISOString()
    const writeClient = tryCreateSupabaseServiceClient() ?? supabase

    await writeClient.from("application_review").insert({
        application_id: params.applicationId,
        status: "PENDING",
        feedback: null,
        reviewed_by_profile_id: params.reviewedByProfileId,
        updated_at: now,
    })

    await writeClient
        .from("application")
        .update({
            status: "PENDING",
            updated_at: now,
        })
        .eq("id", params.applicationId)
}
