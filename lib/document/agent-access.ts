import type { createSupabaseServerClient } from "@/lib/supabase/server"
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

export async function assertAgentCanAccessDocument(
    supabase: SupabaseServerClient,
    agentProfileId: string,
    documentId: string
) {
    const { data: document, error } = await supabase
        .from("document")
        .select("profile_id")
        .eq("id", documentId)
        .maybeSingle()

    if (error || !document) {
        return { allowed: false as const, document: null }
    }

    const allowed = await assertAgentCanAccessStudentProfile(
        supabase,
        agentProfileId,
        document.profile_id
    )

    return { allowed, document }
}
