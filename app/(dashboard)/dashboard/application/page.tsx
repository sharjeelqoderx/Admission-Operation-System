"use client"

import { useAuth } from "@/hooks/useAuth"
import { isUniversityStaffRole } from "@/lib/auth/university-role"
import { Role } from "@/types/enums/role"
import { ListPageSkeleton } from "@/components/shared/page-skeleton"
import { PageContent } from "./_components/page-content"
import { UniversityApplicationListPageContent } from "./_components/university-application/page-content"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function ApplicationPage() {
    const { me } = useAuth()
    const router = useRouter()
    const role = me.data?.role

    useEffect(() => {
        if (!role) return
        if (!isUniversityStaffRole(role) && role !== Role.AGENT && role !== Role.STUDENT) {
            router.replace("/dashboard")
        }
    }, [role, router])

    if (!role) {
        return <ListPageSkeleton />
    }

    if (isUniversityStaffRole(role)) {
        return <UniversityApplicationListPageContent />
    }

    if (role === Role.AGENT || role === Role.STUDENT) {
        return <PageContent />
    }

    return <ListPageSkeleton />
}
