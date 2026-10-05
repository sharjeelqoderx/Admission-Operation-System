"use client"

import { useAuth } from "@/hooks/useAuth"
import { isUniversityRole, isUniversityStaffRole } from "@/lib/auth/university-role"
import { AgentStudentProgramPage } from "./_components/agent-student-program-page"
import { UniversityProgramListPageContent } from "./_components/university-program/page-content"
import Loading from "./loading"

export default function ProgramPage() {
    const { me } = useAuth()
    const role = me.data?.role

    if (!role) {
        return <Loading />
    }

    if (isUniversityStaffRole(role)) {
        return (
            <UniversityProgramListPageContent canManagePrograms={!isUniversityRole(role)} />
        )
    }

    return <AgentStudentProgramPage />
}
