"use client"

import { useAuth } from "@/hooks/useAuth"
import { isUniversityRole } from "@/lib/auth/university-role"
import { PageContent } from "./_components/page-content"
import Loading from "./loading"

export default function DocumentTemplatesPage() {
    const { me } = useAuth()
    const role = me.data?.role

    if (!role) {
        return <Loading />
    }

    return (
        <PageContent
            canCreateTemplate={!isUniversityRole(role)}
            canDeleteTemplate={!isUniversityRole(role)}
        />
    )
}
