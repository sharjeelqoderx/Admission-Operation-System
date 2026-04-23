import { NextRequest } from "next/server"
import { z } from "zod"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ok, err } from "@/lib/api"

const schema = z.object({
    fullName: z.string().trim().min(2, "Name too short"),
    email: z.string().email("Invalid email"),
    phone: z.string().regex(/^\+?\d{10,15}$/, "Invalid phone"),
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
    if (!parsed.success) return err(parsed.error.issues[0].message)

    const { fullName, email, phone, password, role } = parsed.data

    const supabase = await createSupabaseServerClient()

    const origin = req.headers.get("origin")
        ?? process.env.NEXT_PUBLIC_APP_URL
        ?? "http://localhost:3000"

    // signUp — Supabase sends confirmation email with link to /auth/callback
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${origin}/auth/callback?role=${role}`,
            data: { full_name: fullName, phone, role },
        },
    })

    if (authError) {
        if (authError.message.toLowerCase().includes("already registered"))
            return err("Email already in use", 409)
        return err(authError.message, 500)
    }

    if (!authData.user) return err("Signup failed", 500)

    // Supabase returns a fake user when email already exists (security)
    // Detect this: identities array is empty for existing unconfirmed users
    if (authData.user.identities && authData.user.identities.length === 0) {
        return err("Email already in use", 409)
    }

    // Create or update initial profile row (unverified)
    const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
            user_id: authData.user.id,
            email,
            full_name: fullName,
            phone,
            role,
            is_verified: false,
        }, { onConflict: "user_id" })

    if (profileError) {
        if (profileError.code === "23503" || profileError.message.includes("foreign key"))
            return err("Email already in use", 409)
        return err(profileError.message, 500)
    }

    return ok({ message: "Verification email sent. Please check your inbox." }, 201)
}
