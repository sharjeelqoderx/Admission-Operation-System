import dynamic from "next/dynamic"
import { redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { fetchUniversityOverviewForPage } from "@/lib/university-overview/server"
import { isUniversityStaffRole } from "@/lib/auth/university-role"
import { PageLoader } from "@/components/shared/page-loader"

const ClientDashboard = dynamic(
    () => import("./_components/client-dashboard").then((mod) => mod.ClientDashboard),
    { loading: () => <PageLoader /> }
)

const UniversityOverviewPageContent = dynamic(
    () =>
        import("./_components/university-overview/page-content").then(
            (mod) => mod.UniversityOverviewPageContent
        ),
    { loading: () => <PageLoader /> }
)

export default async function DashboardPage() {
    const role = await getDashboardRole()

    if (!role) {
        redirect("/login")
    }

    if (isUniversityStaffRole(role)) {
        const initialOverview = await fetchUniversityOverviewForPage()
        if (!initialOverview) {
            redirect("/login")
        }
        return <UniversityOverviewPageContent initialOverview={initialOverview} />
    }

    return <ClientDashboard role={role} />
}
