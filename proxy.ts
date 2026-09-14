import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseProxyClient } from "@/lib/supabase/proxy"
import { isAuthPath, isProtectedPath, isSignupEmailStep } from "@/lib/routes"

const SESSION_FLAG = "aos_session"

export async function proxy(request: NextRequest) {
    const response = NextResponse.next({ request })
    const supabase = await createSupabaseProxyClient(request, response)
    const pathname = request.nextUrl.pathname

    if (!supabase) {
        return response
    }

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (user) {
        response.cookies.set(SESSION_FLAG, "1", { path: "/", sameSite: "lax" })
    } else {
        response.cookies.set(SESSION_FLAG, "", { path: "/", maxAge: 0 })
    }

    const searchParams = request.nextUrl.searchParams
    const allowAuthWhileSignedIn = isSignupEmailStep(pathname, searchParams)

    if (isProtectedPath(pathname) && !user) {
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = "/login"
        loginUrl.search = ""
        return NextResponse.redirect(loginUrl)
    }

    if (user && isAuthPath(pathname) && !allowAuthWhileSignedIn) {
        const dashboardUrl = request.nextUrl.clone()
        dashboardUrl.pathname = "/dashboard"
        dashboardUrl.search = ""
        return NextResponse.redirect(dashboardUrl)
    }

    return response
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
}
