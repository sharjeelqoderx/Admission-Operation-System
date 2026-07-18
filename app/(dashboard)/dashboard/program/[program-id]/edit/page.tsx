import { notFound, redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { fetchUniversityProgramDetailForPage } from "@/lib/program/university-server"
import { UniversityProgramFormPageContent } from "../../_components/university-program/form-page-content"
import { Role } from "@/types/enums/role"

type EditProgramPageProps = {
    params: Promise<{ "program-id": string }>
}

export default async function EditProgramPage({ params }: EditProgramPageProps) {
    const role = await getDashboardRole()
    const { "program-id": programId } = await params

    if (!role) {
        redirect("/login")
    }

    if (role !== Role.ADMIN && role !== Role.SUPER_ADMIN) {
        redirect(`/dashboard/program/${programId}`)
    }

    const initialDetail = await fetchUniversityProgramDetailForPage(programId)

    if (!initialDetail) {
        notFound()
    }

    return (
        <UniversityProgramFormPageContent
            mode="edit"
            courseId={programId}
            initialDetail={initialDetail}
        />
    )
}
