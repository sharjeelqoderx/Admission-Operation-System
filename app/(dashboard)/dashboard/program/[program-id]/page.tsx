import { notFound, redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { fetchUniversityProgramDetailForPage } from "@/lib/program/university-server"
import { fetchCourseProgramById } from "@/lib/api/course-program"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { AgentStudentProgramDetailPage } from "../_components/agent-student-program-detail-page"
import { UniversityProgramDetailPageContent } from "../_components/university-program/detail-page-content"
import { isUniversityRole, isUniversityStaffRole } from "@/lib/auth/university-role"

type ProgramDetailPageProps = {
    params: Promise<{ "program-id": string }>
}

export default async function ProgramDetailPage({ params }: ProgramDetailPageProps) {
    const role = await getDashboardRole()
    const { "program-id": programId } = await params

    if (!role) {
        redirect("/login")
    }

    if (isUniversityStaffRole(role)) {
        const initialDetail = await fetchUniversityProgramDetailForPage(programId)

        if (!initialDetail) {
            notFound()
        }

        return (
            <UniversityProgramDetailPageContent
                courseId={programId}
                initialDetail={initialDetail}
                canEditProgram={!isUniversityRole(role)}
            />
        )
    }

    const supabase = await createSupabaseServerClient()
    const initialCourse = await fetchCourseProgramById(supabase, programId)

    if (!initialCourse) {
        notFound()
    }

    return (
        <AgentStudentProgramDetailPage
            courseId={programId}
            initialCourse={initialCourse}
        />
    )
}
