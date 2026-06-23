import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { fetchApplicationDetail } from "@/lib/application/detail"
import type { ApplicationProfileRole } from "@/types/schemas/application"

export async function GET(
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
        const { searchParams } = new URL(req.url)
        const viewScope = searchParams.get("scope") === "all" ? "all" : undefined

        const { data: profile } = await supabase
            .from("profile")
            .select("role")
            .eq("id", user.id)
            .single()

        if (!profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 403 })
        }

        const result = await fetchApplicationDetail(supabase, {
            userId: user.id,
            role: profile.role as ApplicationProfileRole,
            applicationId: id,
            scope: viewScope,
        })

        if ("error" in result) {
            if (result.error === "Forbidden") {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 })
            }

            return NextResponse.json({ error: "Application not found" }, { status: 404 })
        }

        return NextResponse.json({ data: result }, { status: 200 })
    } catch (e) {
        console.error("GET /api/application/[id] error:", e)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
