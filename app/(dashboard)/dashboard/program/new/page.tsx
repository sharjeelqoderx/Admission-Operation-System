import { redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { UniversityProgramFormPageContent } from "../_components/university-program/form-page-content"

export default async function NewProgramPage() {
    const role = await getDashboardRole()

    if (!role) {
        redirect("/login")
    }

    if (role === "UNIVERSITY") {
        redirect("/dashboard/program")
    }

    if (role !== "ADMIN") {
        redirect("/dashboard/program")
    }

    return <UniversityProgramFormPageContent mode="create" />
}
