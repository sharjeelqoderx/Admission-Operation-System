import { UniversityOverviewPageContent } from "./_components/university-overview/page-content"
import { DashboardPageClient } from "./_components/dashboard-page-client"
import { getDashboardRole } from "@/lib/dashboard/server"
import { fetchUniversityOverviewForPage } from "@/lib/university-overview/server"
import { isUniversityStaffRole } from "@/lib/auth/university-role"

export default async function DashboardPage() {
    const role = await getDashboardRole()

    if (role && isUniversityStaffRole(role)) {
        const initialOverview = await fetchUniversityOverviewForPage()
        return <UniversityOverviewPageContent initialOverview={initialOverview ?? undefined} />
    }

    return <DashboardPageClient fallbackRole={role ?? undefined} />
}
