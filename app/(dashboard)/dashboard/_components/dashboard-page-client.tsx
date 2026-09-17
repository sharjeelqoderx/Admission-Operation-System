"use client"

import { ClientDashboard } from "./client-dashboard"
import { DashboardPageSkeleton } from "@/components/shared/page-skeleton"
import { useAuth } from "@/hooks/useAuth"

type DashboardPageClientProps = {
    fallbackRole?: string
}

export function DashboardPageClient({ fallbackRole }: DashboardPageClientProps) {
    const { me } = useAuth()
    const role = me.data?.role ?? fallbackRole

    if (!role) {
        return <DashboardPageSkeleton />
    }

    return <ClientDashboard role={role} />
}
