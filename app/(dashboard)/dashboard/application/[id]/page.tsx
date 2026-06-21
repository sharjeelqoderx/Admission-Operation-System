import { notFound, redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { fetchUniversityApplicationDetailForPage } from "@/lib/application/university-server"
import { AgentStudentApplicationDetailPage } from "./_components/agent-student-application-detail-page"
import { UniversityApplicationDetailPageContent } from "./_components/university-application/page-content"

type ApplicationDetailPageProps = {
    params: Promise<{ id: string }>
}

export default async function ApplicationDetailPage({ params }: ApplicationDetailPageProps) {
    const role = await getDashboardRole()
    const { id } = await params

    if (!role) {
        redirect("/login")
    }

    if (role === "UNIVERSITY" || role === "ADMIN") {
        const initialDetail = await fetchUniversityApplicationDetailForPage(id)

        if (!initialDetail) {
            notFound()
        }

        return (
            <UniversityApplicationDetailPageContent
                applicationId={id}
                initialDetail={initialDetail}
            />
        )
    }

    return <AgentStudentApplicationDetailPage />
}
