import { redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { UniversityProgramFormPageContent } from "../_components/university-program/form-page-content"
import { Role } from "@/types/enums/role"

export default async function NewProgramPage() {
    const role = await getDashboardRole()

    if (!role) {
        redirect("/login")
    }

    if (role !== Role.ADMIN && role !== Role.SUPER_ADMIN) {
        redirect("/dashboard/program")
    }

    return <UniversityProgramFormPageContent mode="create" />
}
