import type { StudentPipelineStatus } from "@/types/schemas/university-student"

export function resolveStudentPipelineStatus(params: {
    applicationStatus?: string | null
    offerStatus?: string | null
    hasOffer?: boolean
}): StudentPipelineStatus {
    if (params.applicationStatus === "REJECTED") {
        return "Rejected"
    }

    if (params.applicationStatus === "APPROVED") {
        return "Completed"
    }

    if (params.offerStatus === "ACCEPTED") {
        return "Signed"
    }

    if (params.hasOffer || params.offerStatus === "PENDING") {
        return "Contract Sent"
    }

    return "Created"
}
