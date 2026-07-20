import { redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { fetchUniversityProgramsForPage } from "@/lib/program/university-server"
import { AgentStudentProgramPage } from "./_components/agent-student-program-page"
import { UniversityProgramListPageContent } from "./_components/university-program/page-content"
import { Role } from "@/types/enums/role"

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

    if (role === Role.ADMIN || role === Role.SUPER_ADMIN) {
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
            <UniversityProgramListPageContent
                initialOverview={initialOverview}
                canManagePrograms={role !== Role.ADMIN}
            />
        )
    }

    return <AgentStudentProgramPage />
}
