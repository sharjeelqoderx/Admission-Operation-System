import { redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { UniversityProgramFormPageContent } from "../../_components/university-program/form-page-content"
import { isUniversityStaffRole } from "@/lib/auth/university-role"

type EditProgramPageProps = {
    params: Promise<{ "program-id": string }>
}

export default async function EditProgramPage({ params }: EditProgramPageProps) {
    const role = await getDashboardRole()
    const { "program-id": programId } = await params

    if (!role) {
        redirect("/login")
    }

    if (!isUniversityStaffRole(role)) {
        redirect(`/dashboard/program/${programId}`)
    }

    return <UniversityProgramFormPageContent mode="edit" courseId={programId} />
}
