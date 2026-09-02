import "server-only"

import type { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseServiceClient } from "@/lib/supabase/server"
import { resolveAgentStudentProfileIds } from "@/lib/api/agent-applications"
import { isUniversityRole, isUniversityStaffRole } from "@/lib/auth/university-role"
import {
    applyUniversityIdFilter,
    resolveUniversityApplicationScope,
} from "@/lib/auth/university-scope"
import { Role } from "@/types/enums/role"

export { isDocumentStaffRole } from "@/lib/auth/university-role"

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

export async function assertAgentCanAccessStudentProfile(
    supabase: SupabaseServerClient,
    agentProfileId: string,
    studentProfileId: string
) {
    const studentProfileIds = await resolveAgentStudentProfileIds(supabase, agentProfileId)
    return studentProfileIds.includes(studentProfileId)
}

export async function assertDocumentStaffCanAccessStudentProfile(
    supabase: SupabaseServerClient,
    userId: string,
    role: string | null | undefined,
    studentProfileId: string
) {
    if (role === Role.STUDENT) {
        return userId === studentProfileId
    }

    if (role === Role.AGENT || role === Role.SUPER_ADMIN) {
        const { data: studentRow } = await supabase
            .from("student")
            .select("profile_id")
            .eq("profile_id", studentProfileId)
            .maybeSingle()

        return Boolean(studentRow)
    }

    if (isUniversityRole(role)) {
        const scope = await resolveUniversityApplicationScope(supabase, userId, role)

        let applicationQuery = supabase
            .from("application")
            .select("profile_id")
            .eq("profile_id", studentProfileId)
            .limit(1)

        applicationQuery = applyUniversityIdFilter(applicationQuery, "university_id", scope)

        const { data: applications } = await applicationQuery

        return Boolean(applications?.length)
    }

    return false
}

export async function assertCanUploadStudentDocument(
    supabase: SupabaseServerClient,
    userId: string,
    role: string | null | undefined,
    studentProfileId: string
) {
    if (role === Role.STUDENT) {
        return userId === studentProfileId
    }

    if (role === Role.AGENT) {
        return assertAgentCanAccessStudentProfile(supabase, userId, studentProfileId)
    }

    return isUniversityStaffRole(role)
}

export async function assertAgentCanAccessDocument(
    supabase: SupabaseServerClient,
    userId: string,
    documentId: string,
    role?: string | null
) {
    const serviceSupabase = createSupabaseServiceClient()

    const { data: document, error } = await serviceSupabase
        .from("document")
        .select("profile_id")
        .eq("id", documentId)
        .maybeSingle()

    if (error || !document) {
        return { allowed: false as const, document: null }
    }

    const allowed = await assertDocumentStaffCanAccessStudentProfile(
        supabase,
        userId,
        role,
        document.profile_id
    )

    return {
        allowed,
        document: allowed ? document : null,
    }
}
