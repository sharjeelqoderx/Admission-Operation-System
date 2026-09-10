"use client"

import { memo, useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { isAuthPath, isProtectedPath, isSignupEmailStep } from "@/lib/routes"
import { PageLoader } from "@/components/shared/page-loader"

/**
 * App-wide session gate (client-only).
 * Uses the cached aos_session hint + one /api/me fetch per signed-in session.
 * Logout clears the hint so /login is not bounced back to /dashboard.
 */
export const AuthProvider = memo(function AuthProvider({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { me, clientReady, sessionActive } = useAuth()

    const isAuthPage = isAuthPath(pathname)
    const isProtectedPage = isProtectedPath(pathname)
    const allowAuthWhileSignedIn = isSignupEmailStep(pathname, searchParams)

    // No session hint → treat as logged out (ignore any stale me cache).
    const user = !sessionActive || me.isError ? undefined : me.data
    const isAuthenticated = Boolean(user)

    const isResolvingSession =
        sessionActive &&
        ((isProtectedPage || (isAuthPage && !allowAuthWhileSignedIn)) &&
            me.isPending &&
            !me.isFetched)

    const isPending = !clientReady || isResolvingSession

    const shouldRedirectToDashboard =
        isAuthenticated && isAuthPage && !allowAuthWhileSignedIn

    const shouldRedirectToLogin =
        clientReady &&
        isProtectedPage &&
        (!sessionActive || (me.isFetched && !isAuthenticated))

    useEffect(() => {
        if (isPending) return

        if (shouldRedirectToDashboard) {
            router.replace("/dashboard")
            return
        }

        if (shouldRedirectToLogin) {
            router.replace("/login")
        }
    }, [
        isPending,
        shouldRedirectToDashboard,
        shouldRedirectToLogin,
        router,
    ])

    if (isPending || shouldRedirectToDashboard || shouldRedirectToLogin) {
        return <PageLoader fullScreen />
    }

    return children
})
