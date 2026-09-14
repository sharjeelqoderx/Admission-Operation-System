"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Role } from "@/types/enums/role"
import { PageLoader } from "@/components/shared/page-loader"

export default function AllApplicationViewLayout({
    children,
}: {
    children: ReactNode
}) {
    const { me } = useAuth()
    const router = useRouter()
    const role = me.data?.role
    const shouldRedirect =
        role === Role.STUDENT || role === Role.ADMIN || role === Role.SUPER_ADMIN

    useEffect(() => {
        if (shouldRedirect) {
            router.replace("/dashboard")
        }
    }, [shouldRedirect, router])

    if (!role || shouldRedirect) {
        return <PageLoader />
    }

    return children
}
