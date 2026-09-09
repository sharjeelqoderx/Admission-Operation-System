/** Auth pages where a logged-in user should normally be redirected away. */
export function isAuthPath(pathname: string | null | undefined): boolean {
    if (!pathname) return false
    return (
        pathname === "/login" ||
        pathname === "/signup" ||
        pathname.startsWith("/login/") ||
        pathname.startsWith("/signup/")
    )
}

/** Pages that require a valid authenticated session. */
export function isProtectedPath(pathname: string | null | undefined): boolean {
    if (!pathname) return false
    return (
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/onboarding") ||
        pathname.startsWith("/profile")
    )
}

/** Signup OTP / email-verify step — allow while a session may already exist. */
export function isSignupEmailStep(
    pathname: string | null | undefined,
    searchParams: { has: (name: string) => boolean } | null | undefined
): boolean {
    if (!pathname || !searchParams) return false
    return pathname.startsWith("/signup") && searchParams.has("email")
}
