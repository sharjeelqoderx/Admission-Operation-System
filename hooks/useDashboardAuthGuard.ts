"use client"

import { useAuth } from "@/hooks/useAuth"

/**
 * Dashboard shell auth state. Route redirects for expired/missing sessions
 * are handled by AuthProvider; this hook only exposes loading/user for layout UI.
 */
export function useDashboardAuthGuard() {
    const { me, clientReady } = useAuth()
    const user = me.isError ? undefined : me.data

    const isAuthLoading =
        !clientReady || ((me.isPending || me.isFetching) && !user && !me.isError)

    const shouldRedirectToLogin =
        clientReady && me.isFetched && (me.isError || !user)

    return {
        user,
        isAuthLoading,
        isAuthenticated: Boolean(user),
        shouldRedirectToLogin,
    }
}
