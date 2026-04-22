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
