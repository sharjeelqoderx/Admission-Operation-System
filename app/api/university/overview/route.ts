import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { err, ok } from "@/lib/api"
import { fetchUniversityOverviewForPage } from "@/lib/university-overview/server"

export async function GET() {
    try {
        const supabase = await createSupabaseServerClient()
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return err("Unauthorized", 401)
        }

        const { data: profile } = await supabase
            .from("profile")
            .select("role")
            .eq("id", user.id)
            .maybeSingle()

        if (profile?.role !== "UNIVERSITY") {
            return err("Forbidden", 403)
        }

        const data = await fetchUniversityOverviewForPage()
        return ok(data)
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Internal server error"
        return NextResponse.json({ success: false, error: message }, { status: 500 })
    }
}
