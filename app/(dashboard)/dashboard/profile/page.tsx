"use client"

import { useAuth } from "@/hooks/useAuth"
import { PageContent } from "./_components/page-content"
import { DashboardPageSkeleton } from "@/components/shared/page-skeleton"
import type { ProfilePageData } from "@/lib/profile/server"

export default function ProfilePage() {
    const { me } = useAuth()

    if (!me.data) {
        return <DashboardPageSkeleton />
    }

    return <PageContent initialData={me.data as ProfilePageData} />
}
