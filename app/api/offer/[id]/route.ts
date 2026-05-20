import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Validate auth
        const supabase = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Use admin client to bypass RLS
        const adminSupabase = await createSupabaseAdminClient();

        const { data: offer, error } = await adminSupabase
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
                    program:program_id (
                        id,
                        name,
                        category,
                        program_length,
                        campus_program_junction (
                            intake_date,
                            tuition_fee,
                            currency,
                            study_type
                        )
                    ),
                    university:university_id ( id, name ),
                    agent:submitted_by_profile_id ( id, name, email ),
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

        if (error) {
            console.error("GET /api/offer/[id] error:", error);
            return NextResponse.json({ error: "Offer not found", details: error.message }, { status: 404 });
        }

        return NextResponse.json({ data: offer }, { status: 200 });
    } catch (e) {
        console.error("GET /api/offer/[id] error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { signatureDataUrl } = await req.json();

        if (!signatureDataUrl) {
            return NextResponse.json({ error: "Signature data is required" }, { status: 400 });
        }

        // Convert base64 data url to Buffer
        const base64Data = signatureDataUrl.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        // Use admin client to bypass RLS for updating files/database
        const adminSupabase = await createSupabaseAdminClient();

        // 1. Upload signature image to Supabase Storage
        const bucketName = "student-admission";
        const objectPath = `signatures/${user.id}/${id}_signature.png`;

        const { error: uploadError } = await adminSupabase.storage
            .from(bucketName)
            .upload(objectPath, buffer, {
                contentType: "image/png",
                upsert: true
            });

        if (uploadError) {
            console.error("Signature upload error:", uploadError);
            return NextResponse.json({ error: "Failed to upload signature", details: uploadError.message }, { status: 500 });
        }

        const baseUrl = process.env.SUPABASE_URL;
        const publicUrl = `${baseUrl}/storage/v1/object/public/${bucketName}/${objectPath}`;

        // 2. Fetch the offer to verify the student profile ID
        const { data: offer, error: fetchError } = await adminSupabase
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
            return NextResponse.json({ error: "Offer not found" }, { status: 404 });
        }

        const studentProfileId = (offer.application as any).profile_id;

        // 3. Update profile signature
        const { error: profileError } = await adminSupabase
            .from("profile")
            .update({ signature: publicUrl })
            .eq("id", studentProfileId);

        if (profileError) {
            console.error("Profile update error:", profileError);
        }

        // 4. Update offer_letter table: status = ACCEPTED, accepted_at = NOW(), file_url = publicUrl
        const { error: offerError } = await adminSupabase
            .from("offer_letter")
            .update({
                status: "ACCEPTED",
                accepted_at: new Date().toISOString(),
                file_url: publicUrl
            })
            .eq("id", id);

        if (offerError) {
            console.error("Offer update error:", offerError);
            return NextResponse.json({ error: "Failed to update offer letter", details: offerError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, url: publicUrl }, { status: 200 });
    } catch (e: any) {
        console.error("POST /api/offer/[id] error:", e);
        return NextResponse.json({ error: "Internal Server Error", details: e?.message }, { status: 500 });
    }
}
