import { NextRequest, NextResponse } from "next/server";
import {
    createSupabaseServerClient,
    createSupabaseServiceClient,
} from "@/lib/supabase/server";
import { withProfileDisplayName } from "@/lib/utils/profile";
import {
    isMissingOfferTemplateColumnError,
    OFFER_DETAIL_SELECT_LEGACY,
    OFFER_DETAIL_SELECT_WITH_TEMPLATE,
} from "@/lib/offer/select-fields";
import { renderOfferBodyHtml } from "@/lib/offer/render-offer-body-html";
import { Role } from "@/types/enums/role";

function canReadOffer(
    role: string | undefined,
    userId: string,
    application: {
        profile_id?: string | null
        university_id?: string | null
    } | null | undefined
) {
    if (!application) return false

    if (role === Role.STUDENT) {
        return application.profile_id === userId
    }

    if (role === Role.ADMIN) {
        return application.university_id === userId
    }

    return role === Role.AGENT || role === Role.SUPER_ADMIN
}

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

        const { data: profile } = await supabase
            .from("profile")
            .select("role")
            .eq("id", user.id)
            .maybeSingle()

        const { id } = await context.params;

        const readClient =
            profile?.role === Role.STUDENT
                ? supabase
                : createSupabaseServiceClient()

        const primaryResult = await readClient
            .from("offer_letter")
            .select(OFFER_DETAIL_SELECT_WITH_TEMPLATE)
            .eq("id", id)
            .single()

        const offerResult =
            primaryResult.error && isMissingOfferTemplateColumnError(primaryResult.error.message)
                ? await readClient
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

        const applicationRecord = offer.application as unknown as (Record<string, unknown> & {
            profile_id?: string | null
            university_id?: string | null
            student?: ProfileRelation | ProfileRelation[] | null
            university?: ProfileRelation | ProfileRelation[] | null
            agent?: ProfileRelation | ProfileRelation[] | null
        }) | null

        if (!canReadOffer(profile?.role, user.id, applicationRecord)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const mappedApplication = applicationRecord
            ? {
                  ...applicationRecord,
                  student: withProfileDisplayName(pickProfile(applicationRecord.student)),
                  university: withProfileDisplayName(pickProfile(applicationRecord.university)),
                  agent: withProfileDisplayName(pickProfile(applicationRecord.agent)),
              }
            : applicationRecord

        const renderedBodyHtml =
            applicationRecord && typeof applicationRecord.id === "string" && typeof applicationRecord.profile_id === "string"
                ? await renderOfferBodyHtml(supabase, {
                      bodyHtml: (offer as { body_html?: string | null }).body_html,
                      documentTemplateId: (offer as { document_template_id?: string | null })
                          .document_template_id,
                      createdAt: offer.created_at,
                      checklistItems: (offer as { checklist_items?: unknown }).checklist_items,
                      checklistProofs: (offer as { checklist_proofs?: unknown }).checklist_proofs,
                      application: {
                          id: applicationRecord.id,
                          application_no:
                              typeof applicationRecord.application_no === "string"
                                  ? applicationRecord.application_no
                                  : null,
                          profile_id: applicationRecord.profile_id,
                          student: applicationRecord.student,
                          course: applicationRecord.course as Parameters<
                              typeof renderOfferBodyHtml
                          >[1]["application"]["course"],
                          university: applicationRecord.university,
                      },
                  })
                : null

        const mappedOffer = {
            ...offer,
            rendered_body_html: renderedBodyHtml,
            application: mappedApplication,
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