import { redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { UniversityProgramFormPageContent } from "../_components/university-program/form-page-content"
import { isUniversityStaffRole } from "@/lib/auth/university-role"
import { Role } from "@/types/enums/role"

export default async function NewProgramPage() {
    const role = await getDashboardRole()

    if (!role) {
        redirect("/login")
    }

    if (!isUniversityStaffRole(role)) {
        redirect("/dashboard/program")
    }

    return <UniversityProgramFormPageContent mode="create" />
}
