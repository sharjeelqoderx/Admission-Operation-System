import { NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ok, err } from "@/lib/api"
import { signupSchema } from "@/types/schemas/auth"

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const parsed = signupSchema.safeParse(body)
        if (!parsed.success) return err(parsed.error.issues[0].message, 400)

        const { title, firstName, lastName, email, phone, password, role } = parsed.data
        const normalizedEmail = email.toLowerCase()
        const fullName = `${firstName} ${lastName}`
        const supabase = await createSupabaseServerClient()

        const { data: existingProfile, error: profileCheckError } = await supabase
            .from("profile")
            .select("id")
            .eq("email", normalizedEmail)
            .maybeSingle()

        if (profileCheckError) return err(profileCheckError.message, 500)
        if (existingProfile) return err("An account with this email already exists", 409)

        const origin = req.headers.get("origin") ?? process.env.APP_URL ?? "https://fhm-admission-op-system.vercel.app"
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
                emailRedirectTo: `${origin}/api/auth/callback`,
                data: { title, full_name: fullName, first_name: firstName, last_name: lastName, phone, role },
            },
        })

        if (authError) {
            const message = authError.message.toLowerCase()
            if (message.includes("already registered") || message.includes("already exists")) {
                return err("An account with this email already exists", 409)
            }
            return err(authError.message, 500)
        }
        if (!authData.user) return err("User creation failed", 500)

        return ok({
            id: authData.user.id,
            email: normalizedEmail,
            fullName,
            firstName,
            lastName,
            role,
            profile: {
                dateOfBirth: "",
                gender: "",
                country: "",
                nationality: "",
                guardianEmail: "",
                guardianPhone: "",
            },
            academic: null,
            experience: null,
            message: "OTP sent to your email. Please verify your account.",
        }, 201)
    } catch {
        return err("Internal server error", 500)
    }
}
