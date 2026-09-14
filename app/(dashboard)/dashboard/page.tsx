"use client"

import { ClientDashboard } from "./_components/client-dashboard"
import { UniversityOverviewPageContent } from "./_components/university-overview/page-content"
import { isUniversityStaffRole } from "@/lib/auth/university-role"
import { DashboardPageSkeleton } from "@/components/shared/page-skeleton"
import { useAuth } from "@/hooks/useAuth"

export default function DashboardPage() {
    const { me } = useAuth()
    const role = me.data?.role

    if (!role) {
        return <DashboardPageSkeleton />
    }

    if (isUniversityStaffRole(role)) {
        return <UniversityOverviewPageContent />
    }

    return <ClientDashboard role={role} />
}
