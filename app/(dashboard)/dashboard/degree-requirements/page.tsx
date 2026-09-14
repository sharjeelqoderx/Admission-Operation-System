"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { isUniversityStaffRole } from "@/lib/auth/university-role"
import { PageContent } from "./_components/page-content"
import { ListPageSkeleton } from "@/components/shared/page-skeleton"

export default function DegreeRequirementsPage() {
    const { me } = useAuth()
    const router = useRouter()
    const role = me.data?.role

    useEffect(() => {
        if (role && !isUniversityStaffRole(role)) {
            router.replace("/dashboard")
        }
    }, [role, router])

    if (!role) {
        return <ListPageSkeleton />
    }

    if (!isUniversityStaffRole(role)) {
        return <ListPageSkeleton />
    }

    return <PageContent />
}
