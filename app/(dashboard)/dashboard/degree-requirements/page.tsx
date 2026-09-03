import { redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { isUniversityStaffRole } from "@/lib/auth/university-role"
import { fetchDegreeRequirements } from "@/lib/degree-requirement/server"
import { PageContent } from "./_components/page-content"

export default async function DegreeRequirementsPage() {
    const role = await getDashboardRole()

    if (!role) {
        redirect("/login")
    }

    if (!isUniversityStaffRole(role)) {
        redirect("/dashboard")
    }

    const initialRequirements = await fetchDegreeRequirements({ includeDeleted: false })

    return <PageContent initialRequirements={initialRequirements} />
}
