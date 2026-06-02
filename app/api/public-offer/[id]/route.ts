import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createSupabaseServiceClient();

        const { id } = await context.params;

        const { data: offer, error } = await supabase
            .from("offer_letter")
            .select(`
                id,
                status,
                created_at,
                accepted_at,
                file_url,
                feedback,
                issued_by_profile_id,
                application!inner (
                    id,
                    application_no,
                    status,
                    created_at,
                    profile_id,
                    submitted_by_profile_id,
                    university_id,
                    student:profile_id (
                        id,
                        name,
                        avatar_url,
                        email,
                        phone,
                        gender,
                        date_of_birth,
                        signature
                    ),
                    course:course_id (
                        id,
                        name,
                        deadline_date,
                        degree:degree_id (
                            id,
                            name,
                            fees,
                            intake_date,
                            study_mode,
                            duration,
                            location,
                            language_of_study
                        )
                    ),
                    university:university_id (
                        id,
                        name
                    ),
                    agent:submitted_by_profile_id (
                        id,
                        name,
                        email
                    ),
                    application_review (
                        id,
                        status,
                        feedback,
                        created_at,
                        reviewed_by_profile_id
                    )
                )
            `)
            .eq("id", id)
            .single();

        if (error || !offer) {
            console.error(
                "GET /api/public-offer/[id] error:",
                error
            );

            return NextResponse.json(
                {
                    error: "Offer not found",
                },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { data: offer },
            { status: 200 }
        );
    } catch (e) {
        console.error(
            "GET /api/public-offer/[id] error:",
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
        const supabase = createSupabaseServiceClient();

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

        const objectPath = `signatures/public/${id}_signature.png`;

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
            "POST /api/public-offer/[id] error:",
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
