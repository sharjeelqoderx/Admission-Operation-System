import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { fetchUniversityStudentsForPage } from "@/lib/student/university-server"
import { PageLoader } from "@/components/shared/page-loader"
import { AgentStudentPage } from "./_components/agent-student-page"
import { UniversityStudentListPageContent } from "./_components/university-student/page-content"

type StudentPageProps = {
    searchParams: Promise<{
        q?: string
        status?: string
        page?: string
    }>
}

export default async function StudentPage({ searchParams }: StudentPageProps) {
    const role = await getDashboardRole()

    if (!role) {
        redirect("/login")
    }

    if (role === "UNIVERSITY") {
        const params = await searchParams
        const initialOverview = await fetchUniversityStudentsForPage({
            q: params.q,
            status: params.status,
            page: params.page ? Number(params.page) : 1,
            limit: 10,
        })

        if (!initialOverview) {
            redirect("/login")
        }

        return (
            <Suspense fallback={<PageLoader label="Loading students..." />}>
                <UniversityStudentListPageContent initialOverview={initialOverview} />
            </Suspense>
        )
    }

    return <AgentStudentPage />
}
