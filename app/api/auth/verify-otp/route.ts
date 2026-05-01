import { NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ok, err } from "@/lib/api"
import { otpSchema } from "@/types/schemas/auth"
import { z } from "zod"

const schema = z.object({
    email: z.string().email(),
    otp: otpSchema.shape.otp,
})

export async function POST(req: NextRequest) {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return err(parsed.error.issues[0].message, 400)

    const { email, otp } = parsed.data
    const supabase = await createSupabaseServerClient()

    const normalizedEmail = email.toLowerCase()

    const { data, error } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: otp,
        type: "signup",
    })

    if (error || !data.user) return err("Invalid or expired OTP", 400)

    return ok({ message: "Account verified successfully" })
}
