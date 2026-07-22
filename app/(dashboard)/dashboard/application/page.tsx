import { redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { fetchUniversityApplicationsForPage } from "@/lib/application/university-server"
import { fetchApplicationDashboardPageData } from "@/lib/application/server"
import { PageContent } from "./_components/page-content"
import { UniversityApplicationListPageContent } from "./_components/university-application/page-content"
import type { UniversityApplicationTab } from "@/types/schemas/university-application"
import { isUniversityStaffRole } from "@/lib/auth/university-role"
import { Role } from "@/types/enums/role"

type ApplicationPageProps = {
    searchParams: Promise<{
        q?: string
        tab?: string
        page?: string
        status?: string
        degree_id?: string
        date_from?: string
        date_to?: string
    }>
}

export default async function ApplicationPage({ searchParams }: ApplicationPageProps) {
    const role = await getDashboardRole()

    if (!role) {
        redirect("/login")
    }

    const params = await searchParams

    if (isUniversityStaffRole(role)) {
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
            <UniversityApplicationListPageContent
                initialOverview={initialOverview}
                initialQuery={{
                    q: params.q ?? "",
                    tab,
                    page: params.page ?? "1",
                }}
            />
        )
    }

    if (role === Role.AGENT || role === Role.STUDENT) {
        const initialData = await fetchApplicationDashboardPageData(params)

        return <PageContent initialData={initialData} />
    }

    redirect("/dashboard")
}
