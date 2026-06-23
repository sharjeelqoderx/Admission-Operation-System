import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get agent row
        const { data: agentRow } = await supabase
            .from("agent")
            .select("id")
            .eq("profile_id", user.id)
            .maybeSingle()

        if (!agentRow) {
            return NextResponse.json({ error: "University Partner profile not found" }, { status: 400 })
        }

        // Run all counts in parallel
        const [studentsResult, applicationsResult, pendingResult] = await Promise.all([
            // Total students created by this agent
            supabase
                .from("student")
                .select("id", { count: "exact", head: true })
                .eq("created_by_agent_id", agentRow.id),

            // Active applications (all submitted by this agent)
            supabase
                .from("application")
                .select("id", { count: "exact", head: true })
                .eq("submitted_by_profile_id", user.id),

            // Pending actions — applications with status PENDING
            supabase
                .from("application")
                .select("id", { count: "exact", head: true })
                .eq("submitted_by_profile_id", user.id)
                .eq("status", "PENDING"),
        ])

        return NextResponse.json({
            data: {
                total_students: studentsResult.count ?? 0,
                active_applications: applicationsResult.count ?? 0,
                pending_actions: pendingResult.count ?? 0,
            },
        }, { status: 200 })
    } catch (e) {
        console.error("GET /api/dashboard/stats error:", e)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
