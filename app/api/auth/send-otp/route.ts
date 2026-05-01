import { NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ok, err } from "@/lib/api"
import { z } from "zod"

const schema = z.object({
    email: z.string().email("Invalid email"),
})

export async function POST(req: NextRequest) {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return err(parsed.error.issues[0].message, 400)

    const { email } = parsed.data
    const supabase = await createSupabaseServerClient()

    const { data: profile } = await supabase
        .from("profile")
        .select("id")
        .eq("email", email.toLowerCase())
        .maybeSingle()

    if (!profile) return err("No account found with this email.", 404)

    const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.toLowerCase(),
    })

    if (error) return err(error.message, 500)

    return ok({ message: "OTP sent successfully." })
}
