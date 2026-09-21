import { redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { isUniversityRole } from "@/lib/auth/university-role"
import { DocumentEditorPage } from "../../_components/document-editor"

type PageProps = {
    params: Promise<{ "template-id": string }>
}

export default async function DocumentTemplateEditPage({ params }: PageProps) {
    const { "template-id": templateId } = await params
    const role = await getDashboardRole()

    if (!role) {
        redirect("/login")
    }

    if (isUniversityRole(role)) {
        redirect(`/dashboard/templates/${templateId}`)
    }

    return <DocumentEditorPage templateId={templateId} />
}
