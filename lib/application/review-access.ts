import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import { isUniversityRole, isUniversityStaffRole } from "@/lib/auth/university-role"
import {
    isUniversityIdInScope,
    resolveUniversityApplicationScope,
} from "@/lib/auth/university-scope"
import { Role } from "@/types/enums/role"
import { canAgentAccessApplication } from "@/lib/api/agent-applications"

export function canReviewApplication(role: string | null | undefined): boolean {
    return isUniversityStaffRole(role)
}

export function canApproveApplicationForSignature(params: {
    role: string | null | undefined
    applicationStatus: string
    hasOffer: boolean
}): boolean {
    return (
        isUniversityStaffRole(params.role) &&
        params.applicationStatus === "PENDING" &&
        !params.hasOffer
    )
}
export function canRejectApplication(params: {
    role: string | null | undefined
    applicationStatus: string
    hasOffer: boolean
}): boolean {
    return (
        canReviewApplication(params.role) &&
        params.applicationStatus === "PENDING" &&
        !params.hasOffer
    )
}

export async function assertCanReviewApplication(
    supabase: SupabaseClient<Database>,
    userId: string,
    applicationId: string,
    role: string | null | undefined
): Promise<
    | {
          allowed: true
          application: {
              id: string
              status: string
              profile_id: string
              university_id: string
          }
      }
    | { allowed: false }
> {
    if (!canReviewApplication(role)) {
        return { allowed: false }
    }

    const { data: application } = await supabase
        .from("application")
        .select("id, status, profile_id, university_id")
        .eq("id", applicationId)
        .maybeSingle()

    if (!application) {
        return { allowed: false }
    }

    if (isUniversityRole(role)) {
        const scope = await resolveUniversityApplicationScope(supabase, userId, role)
        if (!isUniversityIdInScope(application.university_id, scope)) {
            return { allowed: false }
        }
    }

    return { allowed: true, application }
}

export async function assertCanResubmitApplication(
    supabase: SupabaseClient<Database>,
    userId: string,
    application: {
        id: string
        status: string
        profile_id: string
        submitted_by_profile_id: string | null
    },
    role: string | null | undefined
): Promise<boolean> {
    if (!["REJECTED", "NEEDS_REVISION"].includes(application.status)) {
        return false
    }

    if (application.profile_id === userId) {
        return true
    }

    if (role === Role.AGENT) {
        return canAgentAccessApplication(supabase, userId, {
            profile_id: application.profile_id,
            submitted_by_profile_id: application.submitted_by_profile_id,
        })
    }

    return application.submitted_by_profile_id === userId
}
