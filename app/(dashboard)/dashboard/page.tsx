import { UniversityOverviewPageContent } from "./_components/university-overview/page-content"
import { DashboardPageClient } from "./_components/dashboard-page-client"
import { getDashboardRole } from "@/lib/dashboard/server"
import { isUniversityStaffRole } from "@/lib/auth/university-role"

export default async function DashboardPage() {
    const role = await getDashboardRole()

    if (role && isUniversityStaffRole(role)) {
        return <UniversityOverviewPageContent />
    }

    return <DashboardPageClient fallbackRole={role ?? undefined} />
}
