import { redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { fetchOfferDashboardPageData } from "@/lib/offer/server"
import { PageContent } from "./page-content"

type OfferPageProps = {
    searchParams: Promise<{
        q?: string
        page?: string
        limit?: string
    }>
}

export default async function OfferPage({ searchParams }: OfferPageProps) {
    const role = await getDashboardRole()
    if (!role) {
        redirect("/login")
    }

    const params = await searchParams
    const initialData = await fetchOfferDashboardPageData(params)

    return <PageContent initialData={initialData} />
}
