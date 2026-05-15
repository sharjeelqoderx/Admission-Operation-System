import { NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ok, err } from "@/lib/api"
import { uploadPublicImage } from "@/lib/supabase/upload-public-image"

import { profileStep1Schema } from "@/types/schemas/auth"

export async function POST(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) return err("Unauthorized", 401)

        const { data: profile } = await supabase
            .from("profile")
            .select("role")
            .eq("id", user.id)
            .maybeSingle()
        const role = profile?.role ?? "STUDENT"

        const contentType = req.headers.get("content-type") ?? ""
        let data: any = {}
        let avatar_url: string | undefined

        if (contentType.includes("multipart/form-data")) {
            const form = await req.formData()
            form.forEach((val, key) => {
                data[key] = val
            })

            // Specific validation for STUDENT onboarding step 1
            if (role === "STUDENT") {
                const validated = profileStep1Schema.safeParse(data)
                if (!validated.success) {
                    return err(validated.error.issues[0].message, 400)
                }
                const validData = validated.data

                // Upload image
                if (validData.avatar_url instanceof File && validData.avatar_url.size > 0) {
                    const uploaded = await uploadPublicImage({
                        supabase, bucket: "student-admission", userId: user.id, file: validData.avatar_url,
                    })
                    avatar_url = uploaded.publicUrl
                }

                // Update common profile
                const { error: profileError } = await supabase
                    .from("profile")
                    .update({
                        ...(avatar_url && { avatar_url }),
                        name: data.fullName,
                        phone: data.phone,
                        date_of_birth: validData.dob,
                        gender: validData.gender.toUpperCase(),
                    })
                    .eq("id", user.id)

                if (profileError) return err(profileError.message, 500)

                // Update student specific table
                const { data: existingStudent } = await supabase.from("student").select("student_code").eq("profile_id", user.id).maybeSingle()
                let student_code = existingStudent?.student_code
                if (!student_code) {
                    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
                    let code = ''
                    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
                    student_code = `STU-${code}`
                }

                const { error } = await supabase
                    .from("student")
                    .upsert({
                        profile_id: user.id,
                        student_code,
                        country: validData.country,
                        nationality: validData.nationality,
                        guardian_email: validData.guardianEmail,
                        guardian_phone: validData.guardianPhone,
                    }, { onConflict: "profile_id" })
                
                if (error) return err(error.message, 500)
                return ok({ message: "Profile updated" })
            }

            // Fallback for other roles (AGENT, UNIVERSITY) using FormData
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

        // Update common profile (non-student or JSON)
        if (role !== "STUDENT" || !contentType.includes("multipart/form-data")) {
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
        }

        // Update role-specific table (non-student)
        if (role === "AGENT") {
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
