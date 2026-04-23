import { NextRequest } from "next/server"
import { z } from "zod"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ok, err } from "@/lib/api"

const schema = z.object({
    fullName: z.string().trim().min(2, "Name too short"),
    email: z.string().email("Invalid email"),
    phone: z.string().regex(/^\+?\d{7,15}$/, "Invalid phone"),
    role: z.enum(["Agent", "Student"]).default("Student"),
    password: z
        .string()
        .min(8, "At least 8 characters")
        .regex(/[A-Z]/, "Must contain uppercase")
        .regex(/[a-z]/, "Must contain lowercase")
        .regex(/[0-9]/, "Must contain number")
        .regex(/[^A-Za-z0-9]/, "Must contain special character"),
})

export async function POST(req: NextRequest) {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return err(parsed.error.issues[0].message, 400)

    const { fullName, email, phone, password, role } = parsed.data
    const supabase = await createSupabaseServerClient()

    const origin = req.headers.get("origin")
        ?? process.env.NEXT_PUBLIC_APP_URL
        ?? "http://localhost:3000"

    // 1. Check if profile already exists
    const { data: existing } = await supabase
        .from("profiles")
        .select("user_id, is_verified")
        .eq("email", email.toLowerCase())
        .maybeSingle()

    if (existing) {
        if (existing.is_verified) {
            // Active verified account — block
            return err("An account with this email already exists. Please login.", 409)
        } else {
            // Exists but not verified — resend confirmation email
            const { error: resendError } = await supabase.auth.resend({
                type: "signup",
                email,
                options: { emailRedirectTo: `${origin}/auth/callback?role=${role}` },
            })
            if (resendError) return err(resendError.message, 500)
            return ok({ message: "Verification email resent. Please check your inbox." })
        }
    }

    // 2. New user — sign up
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${origin}/auth/callback?role=${role}`,
            data: { full_name: fullName, phone, role },
        },
    })

    if (authError) return err(authError.message, 500)
    if (!authData.user) return err("Signup failed", 500)

    // Supabase fake user check (existing confirmed email)
    if (authData.user.identities?.length === 0) {
        return err("An account with this email already exists. Please login.", 409)
    }

    // 3. Create profile row
    const { error: profileError } = await supabase
        .from("profiles")
        .insert({
            user_id: authData.user.id,
            email: email.toLowerCase(),
            full_name: fullName,
            phone,
            role,
            is_verified: false,
        })

    if (profileError) return err(profileError.message, 500)

    return ok({ message: "Verification email sent. Please check your inbox." }, 201)
}
