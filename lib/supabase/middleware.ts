import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"

export async function createSupabaseMiddlewareClient(req: NextRequest, res: NextResponse) {
    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseKey = process.env.ANON_KEY!

    return createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                getAll: () => req.cookies.getAll(),
                setAll: (cookiesToSet) => {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        req.cookies.set(name, value)
                        res.cookies.set(name, value, options)
                    })
                },
            },
        }
    )
}
