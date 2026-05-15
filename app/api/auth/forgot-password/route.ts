import { NextRequest } from "next/server"
import { z } from "zod"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ok, err } from "@/lib/api"

const schema = z.object({
    email: z.string().email("Invalid email"),
})

export async function POST(req: NextRequest) {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
        return err(parsed.error.issues[0].message)
    }

    const { email } = parsed.data
    const supabase = await createSupabaseServerClient()

    const baseUrl = process.env.APP_URL || "https://fhm-admission-op-system.vercel.app"

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${baseUrl}/api/auth/callback/reset`,
    })

    if (error) {
        return err(error.message, 500)
    }

    return ok({
        message: "If this email exists, a reset link has been sent.",
    })
}