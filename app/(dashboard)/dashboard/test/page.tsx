import { fetchDocumentTemplatesForPage } from "@/lib/document-template/server"
import { PageContent } from "./_components/page-content"

export default async function TestDocumentTemplatesPage() {
    const initialTemplates = await fetchDocumentTemplatesForPage()

    return <PageContent initialTemplates={initialTemplates} />
}
