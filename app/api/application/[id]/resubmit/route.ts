import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { resubmitApplicationById } from "@/lib/application/resubmit"
import { ResubmitApplicationSchema } from "@/types/schemas/application"
import type { ApplicationProfileRole } from "@/types/schemas/application"

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

        const { id } = await params
        const body = await req.json()
        const parsed = ResubmitApplicationSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const { data: profile } = await supabase
            .from("profile")
            .select("role")
            .eq("id", user.id)
            .maybeSingle()

        if (!profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 403 })
        }

        const result = await resubmitApplicationById(supabase, {
            applicationId: id,
            userId: user.id,
            role: profile.role as ApplicationProfileRole,
            documentIds: parsed.data.document_ids,
        })

        if ("error" in result) {
            if (result.error === "not_found") {
                return NextResponse.json({ error: "Application not found" }, { status: 404 })
            }

            return NextResponse.json(
                { error: "You cannot resubmit this application" },
                { status: 403 }
            )
        }

        return NextResponse.json(
            {
                data: result.application,
                message: "Application resubmitted successfully",
            },
            { status: 200 }
        )
    } catch (error) {
        console.error("PATCH /api/application/[id]/resubmit error:", error)
        const message = error instanceof Error ? error.message : "Internal Server Error"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
