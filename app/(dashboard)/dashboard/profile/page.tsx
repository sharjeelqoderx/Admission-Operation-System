import { redirect } from "next/navigation"
import { fetchProfilePageData } from "@/lib/profile/server"
import { PageContent } from "./_components/page-content"

export default async function ProfilePage() {
    const initialData = await fetchProfilePageData()

    if (!initialData) {
        redirect("/login")
    }

    return <PageContent initialData={initialData} />
}
