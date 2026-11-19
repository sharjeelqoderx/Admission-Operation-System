import { redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { AgentStudentDetailPage } from "../_components/agent-student-detail-page"
import { UniversityStudentDetailPageContent } from "./_components/university-student/page-content"
import { isUniversityStaffRole } from "@/lib/auth/university-role"

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
        return <UniversityStudentDetailPageContent profileId={studentId} />
    }

    return <AgentStudentDetailPage studentId={studentId} />
}
