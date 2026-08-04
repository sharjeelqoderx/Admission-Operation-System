import { redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { isUniversityRole } from "@/lib/auth/university-role"
import { CreatePageContent } from "./_components/page-content"

export default async function NewDocumentTemplatePage() {
    const role = await getDashboardRole()

    if (!role) {
        redirect("/login")
    }

    if (isUniversityRole(role)) {
        redirect("/dashboard/templates")
    }

    return <CreatePageContent />
}
