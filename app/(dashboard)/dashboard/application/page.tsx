import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { fetchUniversityApplicationsForPage } from "@/lib/application/university-server"
import { PageLoader } from "@/components/shared/page-loader"
import { AgentStudentApplicationPage } from "./_components/agent-student-application-page"
import { UniversityApplicationListPageContent } from "./_components/university-application/page-content"
import type { UniversityApplicationTab } from "@/types/schemas/university-application"

type ApplicationPageProps = {
    searchParams: Promise<{
        q?: string
        tab?: string
        page?: string
    }>
}

export default async function ApplicationPage({ searchParams }: ApplicationPageProps) {
    const role = await getDashboardRole()

    if (!role) {
        redirect("/login")
    }

    if (role === "UNIVERSITY" || role === "ADMIN") {
        const params = await searchParams
        const tab = (params.tab ?? "all") as UniversityApplicationTab

        const initialOverview = await fetchUniversityApplicationsForPage({
            q: params.q,
            tab,
            page: params.page ? Number(params.page) : 1,
            limit: 10,
        })

        if (!initialOverview) {
            redirect("/login")
        }

        return (
            <Suspense fallback={<PageLoader label="Loading applications..." />}>
                <UniversityApplicationListPageContent initialOverview={initialOverview} />
            </Suspense>
        )
    }

    return <AgentStudentApplicationPage />
}
