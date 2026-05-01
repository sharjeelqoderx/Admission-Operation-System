import { NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ok, err } from "@/lib/api"
import { agentProfileSchema } from "@/types/schemas/auth"
import { uploadPublicImage } from "@/lib/supabase/upload-public-image"

const BUCKET = "student-admission"

async function uploadAndSaveDocument({
    supabase,
    userId,
    file,
    name,
}: {
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
    userId: string
    file: File
    name: string
}) {
    const uploaded = await uploadPublicImage({
        supabase,
        bucket: BUCKET,
        userId,
        file,
    })

    const { error } = await supabase.from("document").insert({
        profile_id: userId,
        uploaded_by_profile_id: userId,
        url: uploaded.publicUrl,
        name,
    })

    if (error) throw new Error(error.message)
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) return err("Unauthorized", 401)

        const form = await req.formData()
        const maybe = (k: string) => {
            const v = form.get(k)
            if (v == null) return undefined
            const s = String(v).trim()
            return s ? s : undefined
        }

        const experienceRaw = maybe("experience_years")
        const body = {
            agent_name: maybe("agent_name"),
            contact_person_name: maybe("contact_person_name"),
            gender: maybe("gender"),
            country: maybe("country"),
            website: maybe("website"),
            experience_years: experienceRaw ? Number(experienceRaw) : undefined,
            address: maybe("address"),
        }

        const parsed = agentProfileSchema.safeParse(body)
        if (!parsed.success) return err(parsed.error.issues[0].message, 400)

        const data = parsed.data

        const { error: profileError } = await supabase
            .from("profile")
            .update({
                name: data.agent_name,
                gender: data.gender,
                role: "AGENT",
            })
            .eq("id", user.id)
        if (profileError) return err(profileError.message, 500)

        const { error: agentError } = await supabase
            .from("agent")
            .upsert({
                profile_id: user.id,
                contact_person_name: data.contact_person_name,
                country: data.country,
                website: data.website,
                experience_years: data.experience_years,
                address: data.address,
            }, { onConflict: "profile_id" })
        if (agentError) return err(agentError.message, 500)

        const registration = form.get("registration_certificate")
        const idFront = form.get("id_card_front")
        const idBack = form.get("id_card_back")

        if (registration instanceof File) {
            await uploadAndSaveDocument({
                supabase,
                userId: user.id,
                file: registration,
                name: "registration_certificate",
            })
        }
        if (idFront instanceof File) {
            await uploadAndSaveDocument({
                supabase,
                userId: user.id,
                file: idFront,
                name: "id_card_front",
            })
        }
        if (idBack instanceof File) {
            await uploadAndSaveDocument({
                supabase,
                userId: user.id,
                file: idBack,
                name: "id_card_back",
            })
        }

        return ok({ message: "Agent profile updated" })
    } catch (e: any) {
        return err(e?.message ?? "Internal server error", 500)
    }
}

