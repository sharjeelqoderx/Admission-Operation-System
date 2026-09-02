"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

export function useDashboardAuthGuard() {
    const router = useRouter()
    const { me, clientReady } = useAuth()
    const { data: user, isLoading, isError, isFetched } = me

    const isAuthLoading = !clientReady || (isLoading && !user)

    const shouldRedirectToLogin = clientReady && isFetched && (isError || !user)

    useEffect(() => {
        if (shouldRedirectToLogin) {
            router.replace("/login")
        }
    }, [router, shouldRedirectToLogin])

    return {
        user,
        isAuthLoading,
        isAuthenticated: Boolean(user),
        shouldRedirectToLogin,
    }
}
