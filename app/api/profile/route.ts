import { NextRequest } from "next/server"
import { z } from "zod"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ok, err } from "@/lib/api"

const schema = z.object({
    userId: z.string().uuid(),
    fullName: z.string().trim().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().regex(/^\+?\d{10,15}$/).optional(),
    dateOfBirth: z.string().optional(),
    gender: z.enum(["male", "female", "other"]).optional(),
    country: z.string().min(2).optional(),
    nationality: z.string().min(2).optional(),
    guardianEmail: z.string().email().optional(),
    guardianPhone: z.string().optional(),
    role: z.enum(["Agent", "Student", "Admin", "Organization"]).optional(),
})

export async function POST(req: NextRequest) {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return err(parsed.error.issues[0].message)

    const { userId, ...data } = parsed.data

    const update: Record<string, unknown> = {}
    if (data.fullName)      update.full_name      = data.fullName
    if (data.email)         update.email          = data.email
    if (data.phone)         update.phone          = data.phone
    if (data.dateOfBirth)   update.date_of_birth  = data.dateOfBirth
    if (data.gender)        update.gender         = data.gender
    if (data.country)       update.country        = data.country
    if (data.nationality)   update.nationality    = data.nationality
    if (data.guardianEmail) update.guardian_email = data.guardianEmail
    if (data.guardianPhone) update.guardian_phone = data.guardianPhone
    if (data.role)          update.role           = data.role

    const supabase = await createSupabaseServerClient()
    const { error } = await supabase
        .from("profiles")
        .update(update)
        .eq("user_id", userId)

    if (error) return err(error.message, 500)

    return ok({ message: "Profile updated" })
}
