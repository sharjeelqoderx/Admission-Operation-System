import { NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ok, err } from "@/lib/api"
import { uploadPublicImage } from "@/lib/supabase/upload-public-image"
import { getFileSizeLimitError, isFileWithinSizeLimit } from "@/lib/constants/file-upload"

import { profileStep1Schema } from "@/types/schemas/auth"
import { normalizeAddressFields } from "@/types/schemas/address"
import { isUniversityRole } from "@/lib/auth/university-role"
import { Role } from "@/types/enums/role"

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
        const role = profile?.role ?? Role.STUDENT

        const contentType = req.headers.get("content-type") ?? ""
        let data: any = {}
        let avatar_url: string | undefined

        if (contentType.includes("multipart/form-data")) {
            const form = await req.formData()
            form.forEach((val, key) => {
                data[key] = val
            })

            // Specific validation for STUDENT onboarding step 1
            if (role === Role.STUDENT) {
                const validated = profileStep1Schema.safeParse(data)
                if (!validated.success) {
                    return err(validated.error.issues[0].message, 400)
                }
                const validData = validated.data

                // Upload image
                if (validData.avatar_url instanceof File && validData.avatar_url.size > 0) {
                    if (!isFileWithinSizeLimit(validData.avatar_url)) {
                        return err(getFileSizeLimitError(validData.avatar_url.name), 400)
                    }
                    const uploaded = await uploadPublicImage({
                        supabase, bucket: "student-admission", userId: user.id, file: validData.avatar_url,
                    })
                    avatar_url = uploaded.publicUrl
                }

                // Update common profile
                const title = data.title
                const firstName = data.firstName
                const lastName = data.lastName
                const { error: profileError } = await supabase
                    .from("profile")
                    .update({
                        ...(avatar_url && { avatar_url }),
                        ...(title && { title: title }),
                        ...(firstName && { first_name: firstName }),
                        ...(lastName && { last_name: lastName }),
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

                const addressFields = normalizeAddressFields({
                    street_1: validData.street_1,
                    street_2: validData.street_2,
                    street_3: validData.street_3,
                    post_code: validData.post_code,
                })

                const { error } = await supabase
                    .from("student")
                    .upsert({
                        profile_id: user.id,
                        student_code,
                        country: validData.country,
                        state: validData.state,
                        city: validData.city,
                        nationality: validData.nationality,
                        guardian_email: validData.guardianEmail || null,
                        guardian_phone: validData.guardianPhone || null,
                        ...addressFields,
                    }, { onConflict: "profile_id" })
                
                if (error) return err(error.message, 500)
                return ok({ message: "Profile updated" })
            }

            // Fallback for other roles (AGENT, ADMIN) using FormData
            const file = form.get("avatar")
            if (file instanceof File && file.size > 0) {
                if (!isFileWithinSizeLimit(file)) {
                    return err(getFileSizeLimitError(file.name), 400)
                }
                const uploaded = await uploadPublicImage({
                    supabase, bucket: "student-admission", userId: user.id, file,
                })
                avatar_url = uploaded.publicUrl
            }
        } else {
            data = await req.json()
        }

        // Update common profile (non-student or JSON)
        if (role !== Role.STUDENT || !contentType.includes("multipart/form-data")) {
            const title = data.title
            const firstName = data.firstName
            const lastName = data.lastName
            const { error: profileError } = await supabase
                .from("profile")
                .update({
                    ...(avatar_url && { avatar_url }),
                    ...(title && { title: title }),
                    ...(firstName && { first_name: firstName }),
                    ...(lastName && { last_name: lastName }),
                    phone: data.phone,
                    date_of_birth: data.date_of_birth,
                    gender: data.gender,
                })
                .eq("id", user.id)
            if (profileError) return err(profileError.message, 500)
        }

        // Update role-specific table (non-student)
        const addressFields = normalizeAddressFields({
            street_1: typeof data.street_1 === "string" ? data.street_1 : undefined,
            street_2: typeof data.street_2 === "string" ? data.street_2 : undefined,
            street_3: typeof data.street_3 === "string" ? data.street_3 : undefined,
            post_code: typeof data.post_code === "string" ? data.post_code : undefined,
        })

        if (role === Role.AGENT) {
            const { error } = await supabase
                .from("agent")
                .upsert({
                    profile_id: user.id,
                    contact_person_first_name: data.contact_person_first_name,
                    contact_person_last_name: data.contact_person_last_name,
                    nationality: data.nationality,
                    country: data.country,
                    state: data.state,
                    city: data.city,
                    ...addressFields,
                    other_contact_number: data.other_contact_number,
                    website: data.website,
                    experience_years: data.experience_years ? Number(data.experience_years) : undefined,
                }, { onConflict: "profile_id" })
            if (error) return err(error.message, 500)
        } else if (isUniversityRole(role)) {
            const { error } = await supabase
                .from("university")
                .upsert({
                    profile_id: user.id,
                    website: data.website,
                    country: data.country,
                    state: data.state,
                    city: data.city,
                    ...addressFields,
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

export async function PATCH(req: NextRequest) {
    return POST(req)
}
