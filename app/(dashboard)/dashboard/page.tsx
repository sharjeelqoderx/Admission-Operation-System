import { redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { fetchUniversityOverviewForPage } from "@/lib/university-overview/server"
import { ClientDashboard } from "./_components/client-dashboard"
import { UniversityOverviewPageContent } from "./_components/university-overview/page-content"

export default async function DashboardPage() {
    const role = await getDashboardRole()

    if (!role) {
        redirect("/login")
    }

    if (role === "UNIVERSITY") {
        const initialOverview = await fetchUniversityOverviewForPage()
        if (!initialOverview) {
            redirect("/login")
        }
        return <UniversityOverviewPageContent initialOverview={initialOverview} />
    }

    return <ClientDashboard role={role} />
}
