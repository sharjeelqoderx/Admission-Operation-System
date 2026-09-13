import { redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { fetchUniversityProgramsForPage } from "@/lib/program/university-server"
import { AgentStudentProgramPage } from "./_components/agent-student-program-page"
import { UniversityProgramListPageContent } from "./_components/university-program/page-content"
import { isUniversityRole, isUniversityStaffRole } from "@/lib/auth/university-role"

type ProgramPageProps = {
    searchParams: Promise<{
        q?: string
        level_id?: string
        page?: string
    }>
}

export default async function ProgramPage({ searchParams }: ProgramPageProps) {
    const role = await getDashboardRole()

    if (!role) {
        redirect("/login")
    }

    if (isUniversityStaffRole(role)) {
        const params = await searchParams
        const initialOverview = await fetchUniversityProgramsForPage({
            q: params.q,
            level_id: params.level_id,
            page: params.page ? Number(params.page) : 1,
            limit: 10,
        })

        if (!initialOverview) {
            redirect("/login")
        }

        return (
            <UniversityProgramListPageContent
                initialOverview={initialOverview}
                canManagePrograms={!isUniversityRole(role)}
            />
        )
    }

    return <AgentStudentProgramPage />
}
