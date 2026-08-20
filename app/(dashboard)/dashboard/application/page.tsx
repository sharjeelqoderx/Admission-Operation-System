import dynamic from "next/dynamic"
import { redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import {
    EMPTY_UNIVERSITY_APPLICATION_LIST,
    fetchUniversityApplicationsForPage,
} from "@/lib/application/university-server"
import { fetchApplicationDashboardPageData } from "@/lib/application/server"
import type { UniversityApplicationTab } from "@/types/schemas/university-application"
import { isUniversityStaffRole } from "@/lib/auth/university-role"
import { Role } from "@/types/enums/role"
import { ListPageSkeleton } from "@/components/shared/page-skeleton"

const PageContent = dynamic(
    () => import("./_components/page-content").then((mod) => mod.PageContent),
    { loading: () => <ListPageSkeleton /> }
)

const UniversityApplicationListPageContent = dynamic(
    () =>
        import("./_components/university-application/page-content").then(
            (mod) => mod.UniversityApplicationListPageContent
        ),
    { loading: () => <ListPageSkeleton /> }
)

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

        const initialOverview =
            (await fetchUniversityApplicationsForPage({
                q: params.q,
                tab,
                page: params.page ? Number(params.page) : 1,
                limit: 10,
            })) ?? EMPTY_UNIVERSITY_APPLICATION_LIST

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
