import { notFound, redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { fetchUniversityAgentDetailForPage } from "@/lib/agent/university-server"
import { UniversityAgentDetailPageContent } from "./_components/university-agent/page-content"
import { isUniversityStaffRole } from "@/lib/auth/university-role"
import { Role } from "@/types/enums/role"

type AgentDetailPageProps = {
    params: Promise<{ "agent-id": string }>
}

export default async function AgentDetailPage({ params }: AgentDetailPageProps) {
    const role = await getDashboardRole()
    const { "agent-id": agentId } = await params

    if (!isUniversityStaffRole(role)) {
        redirect("/dashboard")
    }

    const initialDetail = await fetchUniversityAgentDetailForPage(agentId)

    if (!initialDetail) {
        notFound()
    }

    return (
        <UniversityAgentDetailPageContent profileId={agentId} initialDetail={initialDetail} />
    )
}
