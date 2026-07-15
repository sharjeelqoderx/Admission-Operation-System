import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { fetchUniversityProgramsForPage } from "@/lib/program/university-server"
import { PageLoader } from "@/components/shared/page-loader"
import { AgentStudentProgramPage } from "./_components/agent-student-program-page"
import { UniversityProgramListPageContent } from "./_components/university-program/page-content"

type ProgramPageProps = {
    searchParams: Promise<{
        q?: string
        page?: string
    }>
}

export default async function ProgramPage({ searchParams }: ProgramPageProps) {
    const role = await getDashboardRole()

    if (!role) {
        redirect("/login")
    }

    if (role === "UNIVERSITY" || role === "ADMIN") {
        const params = await searchParams
        const initialOverview = await fetchUniversityProgramsForPage({
            q: params.q,
            page: params.page ? Number(params.page) : 1,
            limit: 10,
        })

        if (!initialOverview) {
            redirect("/login")
        }

        return (
            <Suspense fallback={<PageLoader />}>
                <UniversityProgramListPageContent initialOverview={initialOverview} />
            </Suspense>
        )
    }

    return <AgentStudentProgramPage />
}
