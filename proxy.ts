import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware"
import { NextRequest, NextResponse } from "next/server"

export async function proxy(req: NextRequest) {
    const res = NextResponse.next()
    const supabase = await createSupabaseMiddlewareClient(req, res)
    const { data: { user } } = supabase
        ? await supabase.auth.getUser()
        : { data: { user: null } }

    const path = req.nextUrl.pathname

    if (user) {
        res.cookies.set("aos_session", "1", {
            path: "/",
            sameSite: "lax",
            httpOnly: false,
        })
    } else {
        res.cookies.delete("aos_session")
    }

    // Logged-in → redirect away from login / root
    if (user && (path.startsWith("/login") || path === "/")) {
        return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Logged-in on /signup → redirect unless checking email (?email=)
    if (user && path.startsWith("/signup")) {
        const hasEmail = req.nextUrl.searchParams.has("email")
        if (!hasEmail) {
            return NextResponse.redirect(new URL("/dashboard", req.url))
        }
    }

    // Not logged in (or Supabase env missing) → handle redirects or API 401s
    if (!user && (
        path.startsWith("/dashboard") ||
        path.startsWith("/onboarding") ||
        path.startsWith("/profile") ||
        path.startsWith("/api/student") ||
        path.startsWith("/api/application") ||
        path.startsWith("/api/profile") ||
        path.startsWith("/api/me")
    )) {
        if (path.startsWith("/api/")) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            )
        }
        return NextResponse.redirect(new URL("/login", req.url))
    }

    return res
}

export const config = {
    matcher: [
        "/", 
        "/dashboard/:path*", 
        "/onboarding/:path*", 
        "/profile/:path*", 
        "/login", 
        "/signup",
        "/api/student/:path*",
        "/api/application/:path*",
        "/api/profile/:path*",
        "/api/me"
    ],
}
