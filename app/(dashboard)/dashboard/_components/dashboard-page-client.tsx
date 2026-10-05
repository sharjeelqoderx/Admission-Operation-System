"use client"

import { ClientDashboard } from "./client-dashboard"
import Loading from "../loading"
import { useAuth } from "@/hooks/useAuth"

type DashboardPageClientProps = {
    fallbackRole?: string
}

export function DashboardPageClient({ fallbackRole }: DashboardPageClientProps) {
    const { me } = useAuth()
    const role = me.data?.role ?? fallbackRole

    if (!role) {
        return <Loading />
    }

    return <ClientDashboard role={role} />
}
