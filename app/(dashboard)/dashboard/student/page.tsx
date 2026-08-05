import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { fetchUniversityStudentsForPage } from "@/lib/student/university-server"
import { fetchStudentDashboardPageData } from "@/lib/student/server"
import { PageLoader } from "@/components/shared/page-loader"
import { PageContent } from "./_components/page-content"
import { UniversityStudentListPageContent } from "./_components/university-student/page-content"
import { isUniversityRole } from "@/lib/auth/university-role"
import { Role } from "@/types/enums/role"

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

    // University partners (admin/management) use the university-scoped list.
    // Super admin uses the same full student table as agents.
    if (isUniversityRole(role)) {
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
            <Suspense fallback={<PageLoader />}>
                <UniversityStudentListPageContent initialOverview={initialOverview} />
            </Suspense>
        )
    }

    if (role !== Role.AGENT && role !== Role.SUPER_ADMIN) {
        redirect("/dashboard")
    }

    const params = await searchParams
    const initialData = await fetchStudentDashboardPageData(params)

    return <PageContent initialData={initialData} />
}
