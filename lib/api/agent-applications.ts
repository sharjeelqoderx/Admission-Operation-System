import type { createSupabaseServerClient } from "@/lib/supabase/server"

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

export async function resolveAgentStudentProfileIds(
    supabase: SupabaseServerClient,
    agentProfileId: string
): Promise<string[]> {
    const { data: agentRow, error: agentError } = await supabase
        .from("agent")
        .select("id")
        .eq("profile_id", agentProfileId)
        .maybeSingle()

    if (agentError) {
        throw agentError
    }

    if (!agentRow) {
        return []
    }

    const { data: students, error: studentsError } = await supabase
        .from("student")
        .select("profile_id")
        .eq("created_by_agent_id", agentRow.id)

    if (studentsError) {
        throw studentsError
    }

    return (students ?? [])
        .map((student) => student.profile_id)
        .filter((profileId): profileId is string => Boolean(profileId))
}

export function buildAgentApplicationOrFilter(
    agentProfileId: string,
    studentProfileIds: string[]
): string {
    if (studentProfileIds.length === 0) {
        return `submitted_by_profile_id.eq.${agentProfileId}`
    }

    return `submitted_by_profile_id.eq.${agentProfileId},profile_id.in.(${studentProfileIds.join(",")})`
}

export async function canAgentAccessApplication(
    supabase: SupabaseServerClient,
    agentProfileId: string,
    application: {
        profile_id: string
        submitted_by_profile_id: string | null
    }
): Promise<boolean> {
    if (application.submitted_by_profile_id === agentProfileId) {
        return true
    }

    const studentProfileIds = await resolveAgentStudentProfileIds(supabase, agentProfileId)
    return studentProfileIds.includes(application.profile_id)
}
