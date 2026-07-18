import { redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { fetchDocumentTemplatesForPage } from "@/lib/document-template/server"
import { PageContent } from "./_components/page-content"

export default async function DocumentTemplatesPage() {
    const role = await getDashboardRole()

    if (!role) {
        redirect("/login")
    }

    const initialTemplates = await fetchDocumentTemplatesForPage()

    return <PageContent initialTemplates={initialTemplates} />
}
