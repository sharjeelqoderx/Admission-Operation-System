import { NextRequest } from "next/server"
import { z } from "zod"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ok, err } from "@/lib/api"

const schema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(1, "Password is required"),
})

export async function POST(req: NextRequest) {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return err(parsed.error.issues[0].message)

    const { email, password } = parsed.data
    const supabase = await createSupabaseServerClient()

    const origin = req.headers.get("origin")
        ?? process.env.NEXT_PUBLIC_APP_URL
        ?? "http://localhost:3000"

    // 1. Check verification status from profiles
    const { data: profile } = await supabase
        .from("profiles")
        .select("is_verified, role")
        .eq("email", email.toLowerCase())
        .maybeSingle()

    // 2. If profile exists but not verified — resend confirmation
    if (profile && !profile.is_verified) {
        const { error: resendError } = await supabase.auth.resend({
            type: "signup",
            email,
            options: {
                emailRedirectTo: `${origin}/auth/callback?role=${profile.role ?? "Student"}`,
            },
        })
        if (resendError) return err(resendError.message, 500)
        return err("Your email is not verified. We've resent the confirmation link — please check your inbox.", 403)
    }

    // 3. Sign in
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) return err(error.message, 401)

    return ok({
        user: {
            id: data.user.id,
            email: data.user.email,
            fullName: data.user.user_metadata?.full_name ?? "",
        }
    })
}
