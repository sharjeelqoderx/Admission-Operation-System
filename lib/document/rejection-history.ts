import type { DocumentRejectionHistoryEntry } from "@/types/schemas/document"

type ReviewLike = {
    status: string
    feedback: string | null
    created_at: string
    updated_at?: string | null
}

export function buildRejectionHistory(
    reviews: ReviewLike[] | null | undefined
): DocumentRejectionHistoryEntry[] {
    return (reviews ?? [])
        .filter((review) => review.status === "REJECTED" && review.feedback?.trim())
        .sort((a, b) => {
            const aTime = new Date(a.updated_at ?? a.created_at).getTime()
            const bTime = new Date(b.updated_at ?? b.created_at).getTime()
            return bTime - aTime
        })
        .map((review) => ({
            feedback: review.feedback!.trim(),
            created_at: review.updated_at ?? review.created_at,
        }))
}

export function getLatestRejectionFeedback(
    history: DocumentRejectionHistoryEntry[]
): string | null {
    return history[0]?.feedback ?? null
}
