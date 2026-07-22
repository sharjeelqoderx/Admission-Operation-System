import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceClient } from "@/lib/supabase/server"
import { withProfileDisplayName } from "@/lib/utils/profile"
import {
    isMissingOfferTemplateColumnError,
    OFFER_DETAIL_SELECT_LEGACY,
    OFFER_DETAIL_SELECT_WITH_TEMPLATE,
} from "@/lib/offer/select-fields"

type ProfileRelation = {
    first_name?: string | null
    last_name?: string | null
} | null

function pickProfile(
    value: ProfileRelation | ProfileRelation[] | null | undefined
): ProfileRelation {
    return Array.isArray(value) ? value[0] ?? null : value ?? null
}

function canAccessPublicOffer(
    application: { profile_id?: string | null } | null | undefined,
    userId: string | null | undefined
) {
    if (!userId || !application?.profile_id) {
        return false
    }

    return application.profile_id === userId
}

async function fetchOfferById(id: string) {
    const supabase = createSupabaseServiceClient()

    const primaryResult = await supabase
        .from("offer_letter")
        .select(OFFER_DETAIL_SELECT_WITH_TEMPLATE)
        .eq("id", id)
        .single()

    const offerResult =
        primaryResult.error && isMissingOfferTemplateColumnError(primaryResult.error.message)
            ? await supabase
                  .from("offer_letter")
                  .select(OFFER_DETAIL_SELECT_LEGACY)
                  .eq("id", id)
                  .single()
            : primaryResult

    return offerResult
}

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const userId = req.nextUrl.searchParams.get("user_id")
        if (!userId) {
            return NextResponse.json({ error: "Invalid sign link" }, { status: 400 })
        }

        const { id } = await context.params
        const { data: offer, error } = await fetchOfferById(id)

        if (error || !offer) {
            console.error("GET /api/public-offer/[id] error:", error)
            return NextResponse.json({ error: "Offer not found" }, { status: 404 })
        }

        const applicationRecord = offer.application as unknown as (Record<string, unknown> & {
            profile_id?: string | null
            student?: ProfileRelation | ProfileRelation[] | null
            university?: ProfileRelation | ProfileRelation[] | null
            agent?: ProfileRelation | ProfileRelation[] | null
        }) | null

        if (!canAccessPublicOffer(applicationRecord, userId)) {
            return NextResponse.json({ error: "Invalid sign link" }, { status: 403 })
        }

        const mappedOffer = {
            ...offer,
            application: applicationRecord
                ? {
                      ...applicationRecord,
                      student: withProfileDisplayName(pickProfile(applicationRecord.student)),
                      university: withProfileDisplayName(pickProfile(applicationRecord.university)),
                      agent: withProfileDisplayName(pickProfile(applicationRecord.agent)),
                  }
                : applicationRecord,
        }

        return NextResponse.json({ data: mappedOffer }, { status: 200 })
    } catch (e) {
        console.error("GET /api/public-offer/[id] error:", e)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params
        const { signatureDataUrl, user_id: userId } = await req.json()

        if (!userId) {
            return NextResponse.json({ error: "Invalid sign link" }, { status: 400 })
        }

        if (!signatureDataUrl) {
            return NextResponse.json({ error: "Signature data is required" }, { status: 400 })
        }

        const { data: offer, error: fetchError } = await fetchOfferById(id)

        if (fetchError || !offer) {
            return NextResponse.json({ error: "Offer not found" }, { status: 404 })
        }

        const applicationRecord = offer.application as unknown as {
            profile_id?: string | null
        } | null

        if (!canAccessPublicOffer(applicationRecord, userId)) {
            return NextResponse.json({ error: "Invalid sign link" }, { status: 403 })
        }

        const studentProfileId = applicationRecord?.profile_id
        if (!studentProfileId) {
            return NextResponse.json({ error: "Student profile not found" }, { status: 404 })
        }

        const base64Data = signatureDataUrl.replace(/^data:image\/\w+;base64,/, "")
        const buffer = Buffer.from(base64Data, "base64")
        const bucketName = "student-admission"
        const objectPath = `signatures/${studentProfileId}/${id}_signature.png`

        const supabase = createSupabaseServiceClient()

        const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(objectPath, buffer, {
                contentType: "image/png",
                upsert: true,
            })

        if (uploadError) {
            console.error("Signature upload error:", uploadError)
            return NextResponse.json(
                { error: "Failed to upload signature", details: uploadError.message },
                { status: 500 }
            )
        }

        const {
            data: { publicUrl },
        } = supabase.storage.from(bucketName).getPublicUrl(objectPath)

        const { error: profileError } = await supabase
            .from("profile")
            .update({ signature: publicUrl })
            .eq("id", studentProfileId)

        if (profileError) {
            console.error("Profile update error:", profileError)
            return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
        }

        const { error: offerError } = await supabase
            .from("offer_letter")
            .update({
                status: "ACCEPTED",
                accepted_at: new Date().toISOString(),
                file_url: publicUrl,
            })
            .eq("id", id)

        if (offerError) {
            console.error("Offer update error:", offerError)
            return NextResponse.json(
                { error: "Failed to update offer letter", details: offerError.message },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true, url: publicUrl }, { status: 200 })
    } catch (e: unknown) {
        console.error("POST /api/public-offer/[id] error:", e)
        return NextResponse.json(
            {
                error: "Internal Server Error",
                details: e instanceof Error ? e.message : undefined,
            },
            { status: 500 }
        )
    }
}
