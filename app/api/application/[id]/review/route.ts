import { NextRequest, NextResponse } from "next/server"
import {
    createSupabaseServerClient,
    tryCreateSupabaseServiceClient,
} from "@/lib/supabase/server"
import { assertCanReviewApplication } from "@/lib/application/review-access"
import { ApplicationReviewActionSchema } from "@/types/schemas/application"

function isReviewWriteBlocked(error: { code?: string; message?: string } | null) {
    if (!error) return false
    return (
        error.code === "PGRST116" ||
        error.code === "42501" ||
        /row-level security/i.test(error.message ?? "")
    )
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createSupabaseServerClient()
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from("profile")
            .select("role")
            .eq("id", user.id)
            .single()

        const { id: applicationId } = await params
        const body = await req.json()
        const parsed = ApplicationReviewActionSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const access = await assertCanReviewApplication(
            supabase,
            user.id,
            applicationId,
            profile?.role
        )

        if (!access.allowed) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { data: offer } = await supabase
            .from("offer_letter")
            .select("id")
            .eq("application_id", applicationId)
            .limit(1)
            .maybeSingle()

        if (offer) {
            return NextResponse.json(
                { error: "Cannot review an application that already has an offer" },
                { status: 400 }
            )
        }

        if (access.application.status !== "PENDING" && parsed.data.status !== "APPROVED") {
            return NextResponse.json(
                { error: "Only pending applications can be reviewed" },
                { status: 400 }
            )
        }

        const reviewPayload = {
            application_id: applicationId,
            status: parsed.data.status,
            feedback:
                parsed.data.status === "REJECTED" || parsed.data.status === "NEEDS_REVISION"
                    ? parsed.data.feedback?.trim() ?? null
                    : null,
            reviewed_by_profile_id: user.id,
            updated_at: new Date().toISOString(),
        }

        const serviceClient = tryCreateSupabaseServiceClient()
        const writeClient = serviceClient ?? supabase

        const insertResult = await writeClient
            .from("application_review")
            .insert(reviewPayload)
            .select(
                "id, status, feedback, application_id, reviewed_by_profile_id, created_at, updated_at"
            )
            .single()

        if (insertResult.error || !insertResult.data) {
            if (!serviceClient && isReviewWriteBlocked(insertResult.error)) {
                return NextResponse.json(
                    {
                        error: "Failed to create application review",
                        details: insertResult.error,
                        hint: "Ensure migration 072_application_review_writes.sql is applied, or set SUPABASE_SERVICE_ROLE_KEY.",
                    },
                    { status: 500 }
                )
            }

            console.error("PATCH /api/application/review insert error:", insertResult.error)
            return NextResponse.json(
                { error: "Failed to create application review", details: insertResult.error },
                { status: 500 }
            )
        }

        const updateResult = await writeClient
            .from("application")
            .update({
                status: parsed.data.status,
                updated_at: new Date().toISOString(),
            })
            .eq("id", applicationId)
            .select("id, status")
            .single()

        if (updateResult.error || !updateResult.data) {
            console.error("PATCH /api/application/review application update error:", updateResult.error)
            return NextResponse.json(
                { error: "Failed to update application status", details: updateResult.error },
                { status: 500 }
            )
        }

        return NextResponse.json(
            {
                data: {
                    review: insertResult.data,
                    application: updateResult.data,
                },
            },
            { status: 200 }
        )
    } catch (error) {
        console.error("PATCH /api/application/[id]/review error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
