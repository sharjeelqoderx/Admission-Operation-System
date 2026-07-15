import { redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { fetchAllApplicationViewPageData } from "@/lib/application/server"
import { PageContent } from "./page-content"

type AllApplicationViewPageProps = {
    searchParams: Promise<{
        q?: string
        status?: string
        degree_id?: string
        date_from?: string
        date_to?: string
        page?: string
        limit?: string
    }>
}

export default async function AllApplicationViewPage({
    searchParams,
}: AllApplicationViewPageProps) {
    const role = await getDashboardRole()

    if (!role) {
        redirect("/login")
    }

    if (role === "STUDENT" || role === "UNIVERSITY") {
        redirect("/dashboard")
    }

    const params = await searchParams
    const initialData = await fetchAllApplicationViewPageData(params)

    return <PageContent initialData={initialData} />
}
