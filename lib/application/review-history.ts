import type { ApplicationReviewHistoryEntry } from "@/types/schemas/application"
import { formatFullName } from "@/lib/utils/profile"

type ReviewLike = {
    status: string
    feedback: string | null
    created_at: string
    updated_at?: string | null
    reviewed_by_profile_id: string | null
    reviewed_by?:
        | {
              id: string
              first_name: string | null
              last_name: string | null
          }
        | Array<{
              id: string
              first_name: string | null
              last_name: string | null
          }>
        | null
}

function resolveReviewer(review: ReviewLike) {
    const profile = Array.isArray(review.reviewed_by)
        ? review.reviewed_by[0]
        : review.reviewed_by

    return {
        reviewed_by_profile_id: review.reviewed_by_profile_id ?? profile?.id ?? null,
        reviewed_by_name: profile
            ? formatFullName(profile.first_name, profile.last_name, "—")
            : null,
    }
}

export function buildApplicationReviewHistory(
    reviews: ReviewLike[] | null | undefined
): ApplicationReviewHistoryEntry[] {
    return (reviews ?? [])
        .slice()
        .sort((a, b) => {
            const aTime = new Date(a.updated_at ?? a.created_at).getTime()
            const bTime = new Date(b.updated_at ?? b.created_at).getTime()
            return bTime - aTime
        })
        .map((review) => {
            const reviewer = resolveReviewer(review)
            return {
                status: review.status,
                feedback: review.feedback?.trim() || null,
                created_at: review.updated_at ?? review.created_at,
                reviewed_by_profile_id: reviewer.reviewed_by_profile_id,
                reviewed_by_name: reviewer.reviewed_by_name,
            }
        })
}

export function buildApplicationRejectionHistory(
    history: ApplicationReviewHistoryEntry[]
): ApplicationReviewHistoryEntry[] {
    return history.filter(
        (entry) => entry.status === "REJECTED" && Boolean(entry.feedback?.trim())
    )
}

export function getLatestApplicationRejectionFeedback(
    history: ApplicationReviewHistoryEntry[]
): string | null {
    return history[0]?.feedback ?? null
}
