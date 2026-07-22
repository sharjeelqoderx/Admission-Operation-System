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

function resolveServiceRoleKey() {
    return process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
}

function isLegacyJwtKey(key: string) {
    return key.startsWith("eyJ")
}

export function createSupabaseServiceClient() {
    const supabaseUrl = process.env.SUPABASE_URL
    const serviceRoleKey = resolveServiceRoleKey()

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error(
            "Missing SUPABASE_URL or service role key (SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY)"
        )
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    })
}

export function tryCreateSupabaseAuthAdminClient() {
    try {
        const supabaseUrl = process.env.SUPABASE_URL
        const serviceRoleKey =
            process.env.SUPABASE_SERVICE_ROLE_KEY ??
            (process.env.SUPABASE_SECRET_KEY && isLegacyJwtKey(process.env.SUPABASE_SECRET_KEY)
                ? process.env.SUPABASE_SECRET_KEY
                : undefined)

        if (!supabaseUrl || !serviceRoleKey) {
            return null
        }

        return createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        })
    } catch {
        return null
    }
}

export function tryCreateSupabaseServiceClient() {
    try {
        return createSupabaseServiceClient()
    } catch {
        return null
    }
}
