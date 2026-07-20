import { notFound, redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { fetchUniversityProgramDetailForPage } from "@/lib/program/university-server"
import { AgentStudentProgramDetailPage } from "../_components/agent-student-program-detail-page"
import { UniversityProgramDetailPageContent } from "../_components/university-program/detail-page-content"
import { Role } from "@/types/enums/role"

type ProgramDetailPageProps = {
    params: Promise<{ "program-id": string }>
}

export default async function ProgramDetailPage({ params }: ProgramDetailPageProps) {
    const role = await getDashboardRole()
    const { "program-id": programId } = await params

    if (!role) {
        redirect("/login")
    }

    if (role === Role.ADMIN || role === Role.SUPER_ADMIN) {
        const initialDetail = await fetchUniversityProgramDetailForPage(programId)

        if (!initialDetail) {
            notFound()
        }

        return (
            <UniversityProgramDetailPageContent
                courseId={programId}
                initialDetail={initialDetail}
                canEditProgram={role !== Role.ADMIN}
            />
        )
    }

    return <AgentStudentProgramDetailPage />
}
