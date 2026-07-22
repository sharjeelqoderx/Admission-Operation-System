import { NextRequest, NextResponse } from "next/server"
import {
    createSupabaseServerClient,
    tryCreateSupabaseServiceClient,
} from "@/lib/supabase/server"
import {
    assertAgentCanAccessDocument,
    isDocumentStaffRole,
} from "@/lib/document/agent-access"
import { DocumentReviewActionSchema } from "@/types/schemas/document"
import { Role } from "@/types/enums/role"

function isReviewWriteBlocked(error: { code?: string; message?: string } | null) {
    if (!error) return false
    return error.code === "PGRST116" || error.code === "42501" || /row-level security/i.test(error.message ?? "")
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ "document-id": string }> }
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

        if (!isDocumentStaffRole(profile?.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { "document-id": documentId } = await params
        const body = await req.json()
        const parsed = DocumentReviewActionSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const access = await assertAgentCanAccessDocument(
            supabase,
            user.id,
            documentId,
            profile?.role
        )
        if (!access.allowed || !access.document) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { data: existingReview, error: reviewFetchError } = await supabase
            .from("document_review")
            .select("id")
            .eq("document_id", documentId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()

        if (reviewFetchError) {
            console.error("PATCH /api/document/review fetch error:", reviewFetchError)
            return NextResponse.json(
                { error: "Failed to fetch document review", details: reviewFetchError },
                { status: 500 }
            )
        }

        const updatePayload = {
            status: parsed.data.status,
            feedback:
                parsed.data.status === "REJECTED"
                    ? parsed.data.feedback?.trim() ?? null
                    : null,
            reviewed_by_profile_id: user.id,
            updated_at: new Date().toISOString(),
        }

        const serviceClient = tryCreateSupabaseServiceClient()

        let reviewRow

        if (existingReview) {
            let updateResult = await supabase
                .from("document_review")
                .update(updatePayload)
                .eq("id", existingReview.id)
                .select("id, status, feedback, document_id, updated_at")
                .single()

            if (isReviewWriteBlocked(updateResult.error) && serviceClient) {
                updateResult = await serviceClient
                    .from("document_review")
                    .update(updatePayload)
                    .eq("id", existingReview.id)
                    .select("id, status, feedback, document_id, updated_at")
                    .single()
            }

            if (updateResult.error || !updateResult.data) {
                console.error("PATCH /api/document/review update error:", updateResult.error)
                return NextResponse.json(
                    {
                        error: "Failed to update document review",
                        details: updateResult.error,
                        hint: "Ensure migration 056_agent_document_review_update.sql is applied, or set SUPABASE_SERVICE_ROLE_KEY.",
                    },
                    { status: 500 }
                )
            }

            reviewRow = updateResult.data
        } else {
            let insertResult = await supabase
                .from("document_review")
                .insert({
                    document_id: documentId,
                    ...updatePayload,
                })
                .select("id, status, feedback, document_id, updated_at")
                .single()

            if (isReviewWriteBlocked(insertResult.error) && serviceClient) {
                insertResult = await serviceClient
                    .from("document_review")
                    .insert({
                        document_id: documentId,
                        ...updatePayload,
                    })
                    .select("id, status, feedback, document_id, updated_at")
                    .single()
            }

            if (insertResult.error || !insertResult.data) {
                console.error("PATCH /api/document/review insert error:", insertResult.error)
                return NextResponse.json(
                    {
                        error: "Failed to create document review",
                        details: insertResult.error,
                        hint: "Ensure migration 056_agent_document_review_update.sql is applied, or set SUPABASE_SERVICE_ROLE_KEY.",
                    },
                    { status: 500 }
                )
            }

            reviewRow = insertResult.data
        }

        return NextResponse.json({ data: reviewRow }, { status: 200 })
    } catch (error) {
        console.error("PATCH /api/document/review error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
