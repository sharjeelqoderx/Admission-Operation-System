import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { err } from "@/lib/api"

export async function POST() {
    try {
        const supabaseUrl = process.env.SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY

        if (!supabaseUrl || !supabaseKey) {
            return err("Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY", 500)
        }

        const cookieStore = await cookies()
        const response = NextResponse.json({
            success: true,
            data: { message: "Logged out" },
        })

        const supabase = createServerClient(supabaseUrl, supabaseKey, {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cookiesToSet) => {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options)
                        response.cookies.set(name, value, options)
                    })
                },
            },
        })

        await supabase.auth.signOut({ scope: "global" })

        // Clear client session hint so AuthProvider does not treat the user as signed in.
        response.cookies.set("aos_session", "", {
            path: "/",
            maxAge: 0,
            sameSite: "lax",
        })

        return response
    } catch {
        return err("Failed to log out", 500)
    }
}
