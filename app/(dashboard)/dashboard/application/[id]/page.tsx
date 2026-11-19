import { redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { PageContent } from "./_components/page-content"
import { UniversityApplicationDetailPageContent } from "./_components/university-application/page-content"
import { isUniversityStaffRole } from "@/lib/auth/university-role"

type ApplicationDetailPageProps = {
    params: Promise<{ id: string }>
}

export default async function ApplicationDetailPage({ params }: ApplicationDetailPageProps) {
    const role = await getDashboardRole()
    const { id } = await params

    if (!role) {
        redirect("/login")
    }

    if (isUniversityStaffRole(role)) {
        return <UniversityApplicationDetailPageContent applicationId={id} />
    }

    return <PageContent applicationId={id} />
}
