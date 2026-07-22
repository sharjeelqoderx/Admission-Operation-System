import { notFound, redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { fetchUniversityStudentDetailForPage } from "@/lib/student/university-server"
import { AgentStudentDetailPage } from "../_components/agent-student-detail-page"
import { UniversityStudentDetailPageContent } from "./_components/university-student/page-content"
import { isUniversityStaffRole } from "@/lib/auth/university-role"
import { Role } from "@/types/enums/role"

type StudentDetailPageProps = {
    params: Promise<{ "student-id": string }>
}

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
    const role = await getDashboardRole()
    const { "student-id": studentId } = await params

    if (!role) {
        redirect("/login")
    }

    if (isUniversityStaffRole(role)) {
        const initialDetail = await fetchUniversityStudentDetailForPage(studentId)

        if (!initialDetail) {
            notFound()
        }

        return (
            <UniversityStudentDetailPageContent
                profileId={studentId}
                initialDetail={initialDetail}
            />
        )
    }

    return <AgentStudentDetailPage studentId={studentId} />
}
