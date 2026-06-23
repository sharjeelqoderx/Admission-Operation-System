import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { fetchUniversityAgentsForPage } from "@/lib/agent/university-server"
import { PageLoader } from "@/components/shared/page-loader"
import { UniversityAgentListPageContent } from "./_components/university-agent/page-content"

type AgentPageProps = {
    searchParams: Promise<{
        status?: string
        page?: string
    }>
}

export default async function AgentPage({ searchParams }: AgentPageProps) {
    const role = await getDashboardRole()

    if (role !== "UNIVERSITY") {
        redirect("/dashboard")
    }

    const params = await searchParams
    const initialOverview = await fetchUniversityAgentsForPage({
        status: params.status,
        page: params.page ? Number(params.page) : 1,
        limit: 10,
    })

    if (!initialOverview) {
        redirect("/login")
    }

    return (
        <Suspense fallback={<PageLoader label="Loading agents..." />}>
            <UniversityAgentListPageContent initialOverview={initialOverview} />
        </Suspense>
    )
}
