import { redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { fetchUniversityApplicationDetailForPage } from "@/lib/application/university-server"
import { fetchApplicationDetailForPage } from "@/lib/application/server"
import { PageContent } from "./_components/page-content"
import { UniversityApplicationDetailPageContent } from "./_components/university-application/page-content"

type ApplicationDetailPageProps = {
    params: Promise<{ id: string }>
}

export default async function ApplicationDetailPage({ params }: ApplicationDetailPageProps) {
    const role = await getDashboardRole()
    const { id } = await params

    if (!role) {
        redirect("/login")
    }

    if (role === "UNIVERSITY" || role === "ADMIN") {
        const initialData = await fetchUniversityApplicationDetailForPage(id)

        return (
            <UniversityApplicationDetailPageContent
                applicationId={id}
                initialData={initialData}
            />
        )
    }

    const initialData = await fetchApplicationDetailForPage(id)

    return <PageContent applicationId={id} initialData={initialData} />
}
