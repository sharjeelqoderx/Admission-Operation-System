import type { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseServiceClient } from "@/lib/supabase/server"
import { resolveAgentStudentProfileIds } from "@/lib/api/agent-applications"
import { Role } from "@/types/enums/role"

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

export function isDocumentStaffRole(role: string | null | undefined) {
    return role === Role.AGENT || role === Role.ADMIN || role === Role.SUPER_ADMIN
}

export async function assertAgentCanAccessStudentProfile(
    supabase: SupabaseServerClient,
    agentProfileId: string,
    studentProfileId: string
) {
    const studentProfileIds = await resolveAgentStudentProfileIds(supabase, agentProfileId)
    return studentProfileIds.includes(studentProfileId)
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

    return role === Role.ADMIN || role === Role.SUPER_ADMIN
}

export async function assertAgentCanAccessDocument(
    _supabase: SupabaseServerClient,
    _agentProfileId: string,
    documentId: string
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

    return { allowed: true as const, document }
}
