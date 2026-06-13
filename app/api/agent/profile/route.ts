import { NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ok, err } from "@/lib/api"
import { agentProfileSchema } from "@/types/schemas/auth"
import { uploadPublicImage } from "@/lib/supabase/upload-public-image"
import { assertFilesWithinSizeLimit } from "@/lib/constants/file-upload"

const BUCKET = "student-admission"

const AGENT_DOC_TYPE_BY_FILE: Record<string, string> = {
    registration_certificate: "AGENT_REGISTRATION",
    id_card_front: "AGENT_ID_FRONT",
    id_card_back: "AGENT_ID_BACK",
}

/** DB check constraint: document_files.type IN ('FRONT', 'BACK') */
const AGENT_FILE_SIDE: Record<keyof typeof AGENT_DOC_TYPE_BY_FILE, "FRONT" | "BACK"> = {
    registration_certificate: "FRONT",
    id_card_front: "FRONT",
    id_card_back: "BACK",
}

async function resolveDocumentTypeId(
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
    typeCode: string
) {
    const { data: byCode } = await supabase
        .from("document_type")
        .select("id")
        .eq("code", typeCode)
        .maybeSingle()
    if (byCode?.id) return byCode.id

    const { data: byName } = await supabase
        .from("document_type")
        .select("id")
        .eq("name", typeCode)
        .maybeSingle()

    return byName?.id ?? null
}

async function uploadAndSaveDocument({
    supabase,
    userId,
    file,
    fileKey,
}: {
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
    userId: string
    file: File
    fileKey: keyof typeof AGENT_DOC_TYPE_BY_FILE
}) {
    const documentTypeId = await resolveDocumentTypeId(
        supabase,
        AGENT_DOC_TYPE_BY_FILE[fileKey]
    )

    const { data: document, error: docError } = await supabase
        .from("document")
        .insert({
            profile_id: userId,
            uploaded_by_profile_id: userId,
            document_type_id: documentTypeId,
        })
        .select("id")
        .single()

    if (docError || !document) {
        throw new Error(docError?.message ?? "Failed to create document")
    }

    const uploaded = await uploadPublicImage({
        supabase,
        bucket: BUCKET,
        userId,
        file,
    })

    const { error: fileError } = await supabase.from("document_files").insert({
        document_id: document.id,
        file_url: uploaded.publicUrl,
        type: AGENT_FILE_SIDE[fileKey],
    })

    if (fileError) throw new Error(fileError.message)

    const { error: reviewError } = await supabase.from("document_review").insert({
        document_id: document.id,
        reviewed_by_profile_id: null,
        status: "PENDING",
        feedback: null,
    })

    if (reviewError) throw new Error(reviewError.message)
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
            first_name: maybe("first_name"),
            last_name: maybe("last_name"),
            contact_person_first_name: maybe("contact_person_first_name"),
            contact_person_last_name: maybe("contact_person_last_name"),
            gender: maybe("gender"),
            country: maybe("country"),
            state: maybe("state"),
            city: maybe("city"),
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
                ...(data.first_name && { first_name: data.first_name }),
                ...(data.last_name && { last_name: data.last_name }),
                gender: data.gender,
                role: "AGENT",
            })
            .eq("id", user.id)
        if (profileError) return err(profileError.message, 500)

        const { error: agentError } = await supabase
            .from("agent")
            .upsert({
                profile_id: user.id,
                contact_person_first_name: data.contact_person_first_name,
                contact_person_last_name: data.contact_person_last_name,
                country: data.country,
                state: data.state,
                city: data.city,
                website: data.website,
                experience_years: data.experience_years,
                address: data.address,
            }, { onConflict: "profile_id" })
        if (agentError) return err(agentError.message, 500)

        const registration = form.get("registration_certificate")
        const idFront = form.get("id_card_front")
        const idBack = form.get("id_card_back")

        assertFilesWithinSizeLimit(
            registration instanceof File ? registration : null,
            idFront instanceof File ? idFront : null,
            idBack instanceof File ? idBack : null,
        )

        if (registration instanceof File) {
            await uploadAndSaveDocument({
                supabase,
                userId: user.id,
                file: registration,
                fileKey: "registration_certificate",
            })
        }
        if (idFront instanceof File) {
            await uploadAndSaveDocument({
                supabase,
                userId: user.id,
                file: idFront,
                fileKey: "id_card_front",
            })
        }
        if (idBack instanceof File) {
            await uploadAndSaveDocument({
                supabase,
                userId: user.id,
                file: idBack,
                fileKey: "id_card_back",
            })
        }

        return ok({ message: "Agent profile updated" })
    } catch (e: any) {
        return err(e?.message ?? "Internal server error", 500)
    }
}

export async function PATCH(req: NextRequest) {
    return POST(req)
}

