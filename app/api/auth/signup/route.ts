import { NextRequest } from "next/server"
import { createSupabaseServerClient, tryCreateSupabaseServiceClient } from "@/lib/supabase/server"
import { ok, err } from "@/lib/api"
import { signupSchema } from "@/types/schemas/auth"
import { Role } from "@/types/enums/role"

function getAuthErrorMessage(error: { message?: string } | null | undefined) {
    const message = error?.message?.trim()
    if (!message || message === "{}") {
        return "Signup failed. Unable to send verification email. Configure custom SMTP in your Supabase Auth settings."
    }
    return message
}

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

        if (profileCheckError) {
            return err(profileCheckError.message || "Failed to check existing account", 500)
        }
        if (existingProfile) return err("An account with this email already exists", 409)

        const origin = req.headers.get("origin") ?? process.env.APP_URL ?? "https://fhm-admission-op-system.vercel.app"
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
                emailRedirectTo: `${origin}/api/auth/callback`,
                data: {
                    title,
                    full_name: fullName,
                    first_name: firstName,
                    last_name: lastName,
                    phone,
                    role,
                },
            },
        })

        if (authError) {
            console.error("[SIGNUP_AUTH_ERROR]", authError)
            const message = getAuthErrorMessage(authError).toLowerCase()
            if (message.includes("already registered") || message.includes("already exists")) {
                return err("An account with this email already exists", 409)
            }
            return err(getAuthErrorMessage(authError), 500)
        }
        if (!authData.user) return err("User creation failed", 500)

        if (role === Role.AGENT) {
            const serviceClient = tryCreateSupabaseServiceClient()
            if (!serviceClient) {
                console.error("[SIGNUP_ERROR] Missing SUPABASE_SECRET_KEY for agent role assignment")
                return err("University Partner signup is temporarily unavailable", 500)
            }

            const { error: metadataError } = await serviceClient.auth.admin.updateUserById(
                authData.user.id,
                { app_metadata: { role: Role.AGENT } }
            )
            if (metadataError) {
                console.error("[SIGNUP_AGENT_METADATA_ERROR]", metadataError)
                return err("Failed to finalize University Partner account", 500)
            }

            const { error: profileRoleError } = await serviceClient
                .from("profile")
                .update({ role: Role.AGENT })
                .eq("id", authData.user.id)
            if (profileRoleError) {
                console.error("[SIGNUP_AGENT_PROFILE_ERROR]", profileRoleError)
                return err("Failed to finalize University Partner account", 500)
            }

            const { error: agentRowError } = await serviceClient
                .from("agent")
                .upsert({ profile_id: authData.user.id }, { onConflict: "profile_id" })
            if (agentRowError) {
                console.error("[SIGNUP_AGENT_ROW_ERROR]", agentRowError)
                return err("Failed to finalize University Partner account", 500)
            }
        }

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
    } catch (error) {
        console.error("[SIGNUP_ERROR]", error)
        const message =
            error instanceof Error && error.message.trim() && error.message !== "{}"
                ? error.message
                : "Internal server error"
        return err(message, 500)
    }
}
