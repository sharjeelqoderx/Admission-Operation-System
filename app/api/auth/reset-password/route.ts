import { NextRequest } from "next/server"
import { z } from "zod"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ok, err } from "@/lib/api"

const schema = z.object({
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

    if (!parsed.success) {
        return err(parsed.error.issues[0].message)
    }

    const supabase = await createSupabaseServerClient()

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
        return err("Session expired. Please request a new reset link.", 401)
    }

    const { error } = await supabase.auth.updateUser({
        password: parsed.data.password,
    })

    if (error) return err(error.message, 500)

    return ok({ message: "Password updated successfully" })
}