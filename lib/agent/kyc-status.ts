import type { AgentKycStatus } from "@/types/schemas/university-agent"

export function resolveAgentKycStatus(params: {
    hasDocuments: boolean
    reviewStatuses: string[]
}): AgentKycStatus {
    const { hasDocuments, reviewStatuses } = params

    if (!hasDocuments) {
        return "Pending"
    }

    if (reviewStatuses.includes("REJECTED")) {
        return "Rejected"
    }

    if (reviewStatuses.some((status) => ["NEEDS_REVISION", "ACTION_REQUIRED"].includes(status))) {
        return "Resubmission"
    }

    if (
        reviewStatuses.length > 0 &&
        reviewStatuses.every((status) => ["VERIFIED", "APPROVED"].includes(status))
    ) {
        return "Approved"
    }

    if (reviewStatuses.includes("PENDING")) {
        return "Under Review"
    }

    return "Under Review"
}
