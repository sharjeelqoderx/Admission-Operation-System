import { NextRequest, NextResponse } from "next/server"
import {
    createSupabaseServerClient,
    tryCreateSupabaseServiceClient,
} from "@/lib/supabase/server"
import { assertCanReviewApplication } from "@/lib/application/review-access"

type RouteParams = {
    params: Promise<{ id: string }>
}

/**
 * POST /api/university/applications/:id/defer
 * Defers an application to a new intake date
 * - Rejects the original application with the provided reason
 * - Creates a duplicate application for the new intake date
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const supabase = await createSupabaseServerClient()
        const { id: applicationId } = await params

        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from("profile")
            .select("role")
            .eq("id", user.id)
            .single()

        const access = await assertCanReviewApplication(
            supabase,
            user.id,
            applicationId,
            profile?.role
        )

        if (!access.allowed) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
        }

        const body = await request.json()
        const { reason, new_intake_date: newIntakeDate } = body

        if (!reason || typeof reason !== "string" || !reason.trim()) {
            return NextResponse.json(
                { success: false, error: "Deferral reason is required" },
                { status: 400 }
            )
        }

        if (!newIntakeDate || typeof newIntakeDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(newIntakeDate)) {
            return NextResponse.json(
                { success: false, error: "New intake date is required" },
                { status: 400 }
            )
        }

        const { data: currentApplication, error: fetchError } = await supabase
            .from("application")
            .select(
                `
                id,
                profile_id,
                course_id,
                university_id,
                submitted_by_profile_id,
                application_no,
                status,
                created_at,
                updated_at
            `
            )
            .eq("id", applicationId)
            .single()

        if (fetchError || !currentApplication) {
            return NextResponse.json(
                { success: false, error: "Application not found" },
                { status: 404 }
            )
        }

        if (currentApplication.status !== "PENDING") {
            return NextResponse.json(
                { success: false, error: "Only pending applications can be deferred" },
                { status: 400 }
            )
        }

        const { data: existingOffer } = await supabase
            .from("offer_letter")
            .select("id")
            .eq("application_id", applicationId)
            .limit(1)
            .maybeSingle()

        if (existingOffer) {
            return NextResponse.json(
                { success: false, error: "Cannot defer an application that already has an offer" },
                { status: 400 }
            )
        }

        const writeClient = tryCreateSupabaseServiceClient() ?? supabase
        const deferralFeedback = `[DEFERRED] ${reason.trim()}`

        const { error: reviewError } = await writeClient.from("application_review").insert({
            application_id: applicationId,
            status: "REJECTED",
            feedback: deferralFeedback,
            reviewed_by_profile_id: user.id,
            updated_at: new Date().toISOString(),
        })

        if (reviewError) {
            console.error("Error inserting application_review for defer:", reviewError)
            return NextResponse.json(
                { success: false, error: "Failed to record deferral review" },
                { status: 500 }
            )
        }

        const { error: rejectError } = await writeClient
            .from("application")
            .update({
                status: "REJECTED",
                updated_at: new Date().toISOString(),
            })
            .eq("id", applicationId)

        if (rejectError) {
            console.error("Error rejecting original application:", rejectError)
            return NextResponse.json(
                { success: false, error: "Failed to reject application" },
                { status: 500 }
            )
        }

        const newApplicationData = {
            profile_id: currentApplication.profile_id,
            course_id: currentApplication.course_id,
            university_id: currentApplication.university_id,
            submitted_by_profile_id: currentApplication.submitted_by_profile_id,
            status: "PENDING",
            is_deferred: true,
            deferred_from_application_id: applicationId,
            custom_intake_date: newIntakeDate,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }

        const { data: newApplication, error: createError } = await writeClient
            .from("application")
            .insert(newApplicationData)
            .select()
            .single()

        if (createError || !newApplication) {
            console.error("Error creating deferred application:", createError)
            return NextResponse.json(
                { success: false, error: "Failed to create deferred application" },
                { status: 500 }
            )
        }

        const { data: existingDocs, error: docsError } = await writeClient
            .from("application_document")
            .select("document_id")
            .eq("application_id", applicationId)

        if (docsError) {
            console.error("Error fetching application documents for defer:", docsError)
        } else if (existingDocs && existingDocs.length > 0) {
            const now = new Date().toISOString()
            const docLinks = existingDocs.map((row) => ({
                application_id: newApplication.id,
                document_id: row.document_id,
                created_at: now,
                updated_at: now,
            }))
            const { error: docInsertError } = await writeClient
                .from("application_document")
                .insert(docLinks)

            if (docInsertError) {
                console.error("Error copying application_document links:", docInsertError)
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                rejected_application_id: applicationId,
                new_application_id: newApplication.id,
            },
            message: "Application deferred successfully",
        })
    } catch (error) {
        console.error("Defer application error:", error)
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        )
    }
}
