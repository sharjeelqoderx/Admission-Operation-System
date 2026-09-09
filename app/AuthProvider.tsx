"use client"

import { memo, useCallback, useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { setSessionActive } from "@/lib/auth/client-session"
import { isAuthPath, isProtectedPath, isSignupEmailStep } from "@/lib/routes"
import { PageLoader } from "@/components/shared/page-loader"

/**
 * App-wide session gate (client-only).
 * Resolves session once via useAuth().me, caches it, and redirects based on that result.
 * Does not re-check on every navigation — cache is cleared only on login/logout/OTP.
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

    // Treat query errors (e.g. 401 after expiry) as logged out even if stale data remains.
    const user = me.isError ? undefined : me.data
    const isAuthenticated = Boolean(user)

    const needsSessionResolution =
        isProtectedPage || (isAuthPage && sessionActive && !allowAuthWhileSignedIn)

    const isPending =
        !clientReady ||
        (needsSessionResolution && me.isPending && !me.isFetched) ||
        (needsSessionResolution && me.isFetching && !user && !me.isError)

    const shouldRedirectToDashboard =
        isAuthenticated && isAuthPage && !allowAuthWhileSignedIn

    const shouldRedirectToLogin =
        needsSessionResolution &&
        me.isFetched &&
        !isAuthenticated &&
        isProtectedPage

    const clearExpiredSession = useCallback(() => {
        if (me.isError) {
            setSessionActive(false)
        }
    }, [me.isError])

    useEffect(() => {
        clearExpiredSession()
    }, [clearExpiredSession])

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
