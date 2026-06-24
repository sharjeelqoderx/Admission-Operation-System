import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { fetchApplicationDetail } from "@/lib/application/detail"
import { buildOfferChecklistPreviewForApplication } from "@/lib/offer/offer-checklist-preview"
import { OfferChecklistPreviewQuerySchema } from "@/types/schemas/offer"
import type { ApplicationProfileRole } from "@/types/schemas/application"

export async function GET(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data: profile, error: profileError } = await supabase
            .from("profile")
            .select("role")
            .eq("id", user.id)
            .single()

        if (profileError || !profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 })
        }

        if (profile.role !== "UNIVERSITY" && profile.role !== "AGENT" && profile.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { searchParams } = new URL(req.url)
        const parsed = OfferChecklistPreviewQuerySchema.safeParse({
            application_id: searchParams.get("application_id"),
        })

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const applicationResult = await fetchApplicationDetail(supabase, {
            userId: user.id,
            role: profile.role as ApplicationProfileRole,
            applicationId: parsed.data.application_id,
            scope: "all",
        })

        if ("error" in applicationResult) {
            if (applicationResult.error === "Forbidden") {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 })
            }

            return NextResponse.json({ error: "Application not found" }, { status: 404 })
        }

        const templates = await buildOfferChecklistPreviewForApplication(
            supabase,
            applicationResult.id,
            applicationResult.profile_id
        )

        return NextResponse.json({ data: { templates } }, { status: 200 })
    } catch (e) {
        console.error("GET /api/offer/checklist-preview error:", e)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
