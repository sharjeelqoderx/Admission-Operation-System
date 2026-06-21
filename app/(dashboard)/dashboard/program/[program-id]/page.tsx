import { notFound, redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { fetchUniversityProgramDetailForPage } from "@/lib/program/university-server"
import { AgentStudentProgramDetailPage } from "../_components/agent-student-program-detail-page"
import { UniversityProgramDetailPageContent } from "../_components/university-program/detail-page-content"

type ProgramDetailPageProps = {
    params: Promise<{ "program-id": string }>
}

export default async function ProgramDetailPage({ params }: ProgramDetailPageProps) {
    const role = await getDashboardRole()
    const { "program-id": programId } = await params

    if (!role) {
        redirect("/login")
    }

    if (role === "UNIVERSITY" || role === "ADMIN") {
        const initialDetail = await fetchUniversityProgramDetailForPage(programId)

        if (!initialDetail) {
            notFound()
        }

        return (
            <UniversityProgramDetailPageContent
                courseId={programId}
                initialDetail={initialDetail}
            />
        )
    }

    return <AgentStudentProgramDetailPage />
}
