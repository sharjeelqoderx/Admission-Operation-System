import { redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { AgentStudentProgramDetailPage } from "../_components/agent-student-program-detail-page"
import { UniversityProgramDetailPageContent } from "../_components/university-program/detail-page-content"
import { isUniversityRole, isUniversityStaffRole } from "@/lib/auth/university-role"

type ProgramDetailPageProps = {
    params: Promise<{ "program-id": string }>
}

export default async function ProgramDetailPage({ params }: ProgramDetailPageProps) {
    const role = await getDashboardRole()
    const { "program-id": programId } = await params

    if (!role) {
        redirect("/login")
    }

    if (isUniversityStaffRole(role)) {
        return (
            <UniversityProgramDetailPageContent
                courseId={programId}
                canEditProgram={!isUniversityRole(role)}
            />
        )
    }

    return <AgentStudentProgramDetailPage courseId={programId} />
}
