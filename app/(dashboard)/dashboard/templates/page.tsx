"use client"

import { useAuth } from "@/hooks/useAuth"
import { isUniversityRole } from "@/lib/auth/university-role"
import { PageContent } from "./_components/page-content"
import { ListPageSkeleton } from "@/components/shared/page-skeleton"

export default function DocumentTemplatesPage() {
    const { me } = useAuth()
    const role = me.data?.role

    if (!role) {
        return <ListPageSkeleton />
    }

    return (
        <PageContent
            canCreateTemplate={!isUniversityRole(role)}
            canDeleteTemplate={!isUniversityRole(role)}
        />
    )
}
