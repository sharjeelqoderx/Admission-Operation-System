import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware"
import { NextRequest, NextResponse } from "next/server"

export async function proxy(req: NextRequest) {
    const res = NextResponse.next()
    const supabase = await createSupabaseMiddlewareClient(req, res)
    const { data: { user } } = await supabase.auth.getUser()

    const path = req.nextUrl.pathname
    const search = req.nextUrl.searchParams

    // Logged-in user on /login or / → redirect to home
    if (user && (path.startsWith("/login") || path === "/")) {
        return NextResponse.redirect(new URL("/home", req.url))
    }

    // Logged-in user on /signup → only redirect if NOT in profile setup flow or success
    if (user && path.startsWith("/signup")) {
        const inProfileFlow = search.has("noSidebar") || search.has("profile") || search.has("uid")
        const isSuccess = path.startsWith("/signup/success")
        if (!inProfileFlow && !isSuccess) {
            return NextResponse.redirect(new URL("/home", req.url))
        }
    }

    // Not logged in → redirect away from protected pages
    if (!user && (path.startsWith("/home") || path.startsWith("/profile"))) {
        return NextResponse.redirect(new URL("/login", req.url))
    }

    return res
}

export const config = {
    matcher: ["/", "/home/:path*", "/profile/:path*", "/profile", "/login", "/signup", "/signup/:path*"],
}
