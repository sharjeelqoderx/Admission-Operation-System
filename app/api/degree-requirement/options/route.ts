import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
    canManageDegreeRequirements,
    fetchDegreeRequirementOptions,
} from "@/lib/degree-requirement/server"

export async function GET() {
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
            .maybeSingle()

        if (!canManageDegreeRequirements(profile?.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const data = await fetchDegreeRequirementOptions()
        return NextResponse.json({ data })
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
