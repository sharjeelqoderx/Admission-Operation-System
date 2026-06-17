import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { withProfileDisplayName } from "@/lib/utils/profile";
import {
    isMissingOfferTemplateColumnError,
    OFFER_DETAIL_SELECT_LEGACY,
    OFFER_DETAIL_SELECT_WITH_TEMPLATE,
} from "@/lib/offer/select-fields";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createSupabaseServerClient();

        // Validate auth
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await context.params;

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

        const { data: offer, error } = offerResult

        if (error || !offer) {
            console.error(
                "GET /api/offer/[id] error:",
                error
            );

            return NextResponse.json(
                {
                    error: "Offer not found",
                },
                { status: 404 }
            );
        }

        type ProfileRelation = {
            first_name?: string | null
            last_name?: string | null
        } | null

        const pickProfile = (
            value: ProfileRelation | ProfileRelation[] | null | undefined
        ): ProfileRelation => (Array.isArray(value) ? value[0] ?? null : value ?? null)

        const application = offer.application as unknown as (Record<string, unknown> & {
            student?: ProfileRelation | ProfileRelation[] | null
            university?: ProfileRelation | ProfileRelation[] | null
            agent?: ProfileRelation | ProfileRelation[] | null
        }) | null

        const mappedOffer = {
            ...offer,
            application: application
                ? {
                      ...application,
                      student: withProfileDisplayName(pickProfile(application.student)),
                      university: withProfileDisplayName(pickProfile(application.university)),
                      agent: withProfileDisplayName(pickProfile(application.agent)),
                  }
                : application,
        };

        return NextResponse.json(
            { data: mappedOffer },
            { status: 200 }
        );
    } catch (e) {
        console.error(
            "GET /api/offer/[id] error:",
            e
        );

        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const supabase =
            await createSupabaseServerClient();

        // Validate auth
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await context.params;

        const { signatureDataUrl } =
            await req.json();

        if (!signatureDataUrl) {
            return NextResponse.json(
                {
                    error:
                        "Signature data is required",
                },
                { status: 400 }
            );
        }

        // Convert base64 to buffer
        const base64Data =
            signatureDataUrl.replace(
                /^data:image\/\w+;base64,/,
                ""
            );

        const buffer = Buffer.from(
            base64Data,
            "base64"
        );

        // Upload signature
        const bucketName =
            "student-admission";

        const objectPath = `signatures/${user.id}/${id}_signature.png`;

        const { error: uploadError } =
            await supabase.storage
                .from(bucketName)
                .upload(objectPath, buffer, {
                    contentType: "image/png",
                    upsert: true,
                });

        if (uploadError) {
            console.error(
                "Signature upload error:",
                uploadError
            );

            return NextResponse.json(
                {
                    error:
                        "Failed to upload signature",
                    details:
                        uploadError.message,
                },
                { status: 500 }
            );
        }

        // Get public URL
        const {
            data: { publicUrl },
        } = supabase.storage
            .from(bucketName)
            .getPublicUrl(objectPath);

        // Fetch offer
        const {
            data: offer,
            error: fetchError,
        } = await supabase
            .from("offer_letter")
            .select(`
                id,
                application!inner (
                    profile_id
                )
            `)
            .eq("id", id)
            .single();

        if (fetchError || !offer) {
            return NextResponse.json(
                { error: "Offer not found" },
                { status: 404 }
            );
        }

        const studentProfileId =
            (offer.application as any)
                ?.profile_id;

        // Update profile signature
        const { error: profileError } =
            await supabase
                .from("profile")
                .update({
                    signature: publicUrl,
                })
                .eq("id", studentProfileId);

        if (profileError) {
            console.error(
                "Profile update error:",
                profileError
            );

            return NextResponse.json(
                {
                    error:
                        "Failed to update profile",
                },
                { status: 500 }
            );
        }

        // Update offer
        const { error: offerError } =
            await supabase
                .from("offer_letter")
                .update({
                    status: "ACCEPTED",
                    accepted_at:
                        new Date().toISOString(),
                    file_url: publicUrl,
                })
                .eq("id", id);

        if (offerError) {
            console.error(
                "Offer update error:",
                offerError
            );

            return NextResponse.json(
                {
                    error:
                        "Failed to update offer letter",
                    details:
                        offerError.message,
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                url: publicUrl,
            },
            { status: 200 }
        );
    } catch (e: any) {
        console.error(
            "POST /api/offer/[id] error:",
            e
        );

        return NextResponse.json(
            {
                error:
                    "Internal Server Error",
                details: e?.message,
            },
            { status: 500 }
        );
    }
}