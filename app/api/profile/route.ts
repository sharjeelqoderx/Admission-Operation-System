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
        let data: any = {}
        let avatar_url: string | undefined

        if (contentType.includes("multipart/form-data")) {
            const form = await req.formData()
            form.forEach((val, key) => {
                if (key !== "avatar") data[key] = String(val).trim() || undefined
            })
            const file = form.get("avatar")
            if (file instanceof File && file.size > 0) {
                const uploaded = await uploadPublicImage({
                    supabase, bucket: "student-admission", userId: user.id, file,
                })
                avatar_url = uploaded.publicUrl
            }
        } else {
            data = await req.json()
        }

        const { data: profile } = await supabase
            .from("profile")
            .select("role")
            .eq("id", user.id)
            .maybeSingle()
        const role = profile?.role ?? "STUDENT"

        // Update common profile
        const { error: profileError } = await supabase
            .from("profile")
            .update({
                ...(avatar_url && { avatar_url }),
                name: data.fullName,
                phone: data.phone,
                date_of_birth: data.date_of_birth,
                gender: data.gender,
            })
            .eq("id", user.id)

        if (profileError) return err(profileError.message, 500)

        // Update role-specific table
        if (role === "STUDENT") {
            const { error } = await supabase
                .from("student")
                .upsert({
                    profile_id: user.id,
                    country: data.country,
                    nationality: data.nationality,
                    city: data.city,
                    address: data.address,
                    zip_code: data.zip_code,
                    guardian_email: data.guardian_email,
                    guardian_phone: data.guardian_phone,
                }, { onConflict: "profile_id" })
            if (error) return err(error.message, 500)
        } else if (role === "AGENT") {
            const { error } = await supabase
                .from("agent")
                .upsert({
                    profile_id: user.id,
                    contact_person_name: data.contact_person_name,
                    nationality: data.nationality,
                    country: data.country,
                    city: data.city,
                    address: data.address,
                    other_contact_number: data.other_contact_number,
                    website: data.website,
                    experience_years: data.experience_years ? Number(data.experience_years) : undefined,
                }, { onConflict: "profile_id" })
            if (error) return err(error.message, 500)
        } else if (role === "UNIVERSITY") {
            const { error } = await supabase
                .from("university")
                .upsert({
                    profile_id: user.id,
                    website: data.website,
                    country: data.country,
                    city: data.city,
                    address: data.address,
                    description: data.description,
                }, { onConflict: "profile_id" })
            if (error) return err(error.message, 500)
        }

        return ok({ message: "Profile updated" })
    } catch (e: any) {
        console.error("[PROFILE API ERROR]", e)
        return err(e?.message ?? "Internal server error", 500)
    }
}
