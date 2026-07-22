import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"

type ProvisionAuthUserInput = {
    email: string
    password: string
    userMetadata?: Record<string, unknown>
    appMetadata?: Record<string, unknown>
}

export function isSupabaseAuthJwtError(
    error: { message?: string; code?: string } | null | undefined
) {
    if (!error) return false
    if (error.code === "bad_jwt") return true
    return /invalid jwt|unverifiable|es256|hs256|bad_jwt|kid/i.test(error.message ?? "")
}

export async function provisionAuthUser(
    supabaseAuth: SupabaseClient,
    supabaseService: SupabaseClient | null,
    input: ProvisionAuthUserInput
): Promise<{ userId: string } | { error: string }> {
    const email = input.email.toLowerCase()

    if (supabaseService) {
        const { data, error } = await supabaseService.auth.admin.createUser({
            email,
            password: input.password,
            email_confirm: true,
            user_metadata: input.userMetadata,
            app_metadata: input.appMetadata,
        })

        if (!error && data.user) {
            return { userId: data.user.id }
        }

        if (error && !isSupabaseAuthJwtError(error)) {
            const message = error.message?.toLowerCase() ?? ""
            if (message.includes("already") || message.includes("exists")) {
                return { error: "An account with this email already exists." }
            }
            return { error: error.message ?? "Failed to create user account" }
        }
    }

    const { data, error } = await supabaseAuth.auth.signUp({
        email,
        password: input.password,
        options: {
            data: input.userMetadata,
        },
    })

    if (error) {
        const message = error.message?.toLowerCase() ?? ""
        if (message.includes("already") || message.includes("exists")) {
            return { error: "An account with this email already exists." }
        }
        return { error: error.message ?? "Failed to create user account" }
    }

    if (!data.user) {
        return { error: "User creation failed" }
    }

    return { userId: data.user.id }
}
