"use client"

import { useAuth } from "@/hooks/useAuth"
import { isUniversityRole, isUniversityStaffRole } from "@/lib/auth/university-role"
import { AgentStudentProgramPage } from "./_components/agent-student-program-page"
import { UniversityProgramListPageContent } from "./_components/university-program/page-content"
import { ListPageSkeleton } from "@/components/shared/page-skeleton"

export default function ProgramPage() {
    const { me } = useAuth()
    const role = me.data?.role

    if (!role) {
        return <ListPageSkeleton />
    }

    if (isUniversityStaffRole(role)) {
        return (
            <UniversityProgramListPageContent canManagePrograms={!isUniversityRole(role)} />
        )
    }

    return <AgentStudentProgramPage />
}
