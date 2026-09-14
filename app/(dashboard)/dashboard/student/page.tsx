"use client"

import { useAuth } from "@/hooks/useAuth"
import { isUniversityRole } from "@/lib/auth/university-role"
import { Role } from "@/types/enums/role"
import { ListPageSkeleton } from "@/components/shared/page-skeleton"
import { PageContent } from "./_components/page-content"
import { UniversityStudentListPageContent } from "./_components/university-student/page-content"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function StudentPage() {
    const { me } = useAuth()
    const router = useRouter()
    const role = me.data?.role

    useEffect(() => {
        if (!role) return
        if (role !== Role.AGENT && role !== Role.SUPER_ADMIN && !isUniversityRole(role)) {
            router.replace("/dashboard")
        }
    }, [role, router])

    if (!role) {
        return <ListPageSkeleton />
    }

    if (isUniversityRole(role)) {
        return <UniversityStudentListPageContent />
    }

    if (role !== Role.AGENT && role !== Role.SUPER_ADMIN) {
        return <ListPageSkeleton />
    }

    return <PageContent />
}
