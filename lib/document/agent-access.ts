import type { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseServiceClient } from "@/lib/supabase/server"
import { resolveAgentStudentProfileIds } from "@/lib/api/agent-applications"

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

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
    if (role === "STUDENT") {
        return userId === studentProfileId
    }

    if (role === "AGENT") {
        return assertAgentCanAccessStudentProfile(supabase, userId, studentProfileId)
    }

    return role === "UNIVERSITY" || role === "ADMIN"
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
