import { redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { fetchUniversityApplicationsForPage } from "@/lib/application/university-server"
import { fetchApplicationDashboardPageData } from "@/lib/application/server"
import { PageContent } from "./_components/page-content"
import { UniversityApplicationListPageContent } from "./_components/university-application/page-content"
import type { UniversityApplicationTab } from "@/types/schemas/university-application"

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

    if (role === "UNIVERSITY" || role === "ADMIN") {
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

        return <UniversityApplicationListPageContent initialOverview={initialOverview} />
    }

    const initialData = await fetchApplicationDashboardPageData(params)

    return <PageContent initialData={initialData} />
}
