import { redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { isUniversityRole } from "@/lib/auth/university-role"
import { ViewPageContent } from "./_components/page-content"

type PageProps = {
    params: Promise<{ "template-id": string }>
}

export default async function DocumentTemplateViewPage({ params }: PageProps) {
    const { "template-id": templateId } = await params
    const role = await getDashboardRole()

    if (!role) {
        redirect("/login")
    }

    return (
        <ViewPageContent
            templateId={templateId}
            canEditTemplate={!isUniversityRole(role)}
        />
    )
}
