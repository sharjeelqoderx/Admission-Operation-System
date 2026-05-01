import { NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ok, err } from "@/lib/api"
import { uploadPublicImage } from "@/lib/supabase/upload-public-image"

export async function POST(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) return err("Unauthorized", 401)

        const contentType = req.headers.get("content-type") ?? ""
        let date_of_birth: string | undefined
        let gender: string | undefined
        let country: string | undefined
        let nationality: string | undefined
        let guardian_email: string | undefined
        let guardian_phone: string | undefined
        let avatar_url: string | undefined

        if (contentType.includes("multipart/form-data")) {
            const form = await req.formData()
            const get = (k: string) => { const v = String(form.get(k) ?? "").trim(); return v || undefined }
            date_of_birth = get("date_of_birth")
            gender = get("gender")
            country = get("country")
            nationality = get("nationality")
            guardian_email = get("guardian_email")
            guardian_phone = get("guardian_phone")

            const file = form.get("avatar")
            if (file instanceof File && file.size > 0) {
                const uploaded = await uploadPublicImage({
                    supabase, bucket: "student-admission", userId: user.id, file,
                })
                avatar_url = uploaded.publicUrl
            }
        } else {
            const body = await req.json()
            date_of_birth = body.date_of_birth
            gender = body.gender
            country = body.country
            nationality = body.nationality
            guardian_email = body.guardian_email
            guardian_phone = body.guardian_phone
        }

        const { error: profileError } = await supabase
            .from("profile")
            .update({ ...(avatar_url && { avatar_url }), date_of_birth, gender })
            .eq("id", user.id)

        if (profileError) return err(profileError.message, 500)

        const { error: studentError } = await supabase
            .from("student")
            .upsert({ profile_id: user.id, country, nationality, guardian_email, guardian_phone }, { onConflict: "profile_id" })

        if (studentError) return err(studentError.message, 500)

        return ok({ message: "Profile updated" })
    } catch (e: any) {
        console.error("[PROFILE API ERROR]", e)
        return err(e?.message ?? "Internal server error", 500)
    }
}
