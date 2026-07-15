import "server-only"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function createSupabaseServerClient() {
    const cookieStore = await cookies()
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY

    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY")
    }

    return createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
            getAll: () => cookieStore.getAll(),
            setAll: (cookiesToSet) => {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    )
                } catch {
                    // Cookie writes can fail outside mutable request contexts.
                }
            },
        },
    })
}

export function createSupabaseServiceClient() {
    const supabaseUrl = process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SECRET_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY")
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    })
}

export function tryCreateSupabaseServiceClient() {
    try {
        return createSupabaseServiceClient()
    } catch {
        return null
    }
}
