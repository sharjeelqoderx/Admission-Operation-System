import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { AppStatus, OfferStatus, Role } from "@/types/constants"

export async function GET(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get user profile to determine role
        const { data: profile } = await supabase
            .from("profile")
            .select("role")
            .eq("id", user.id)
            .single()

        if (!profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 400 })
        }

        let studentsCount = 0
        let applicationsCount = 0
        let pendingCount = 0
        let enrolledCount = 0

        const userRole = profile?.role?.toUpperCase()

        if (userRole === Role.AGENT) {
            // ── AGENT: scoped to students they created ──
            const { data: agentRow } = await supabase
                .from("agent")
                .select("id")
                .eq("profile_id", user.id)
                .maybeSingle()

            if (agentRow) {
                const [studentsRes, applicationsRes, pendingRes, enrolledRes] = await Promise.all([
                    supabase.from("student").select("id", { count: "exact", head: true }).eq("created_by_agent_id", agentRow.id),
                    supabase.from("application").select("id", { count: "exact", head: true }).eq("profile_id", user.id),
                    supabase.from("application").select("id", { count: "exact", head: true }).eq("profile_id", user.id).eq("status", AppStatus.PENDING),
                    supabase.from("offer_letter").select("id, application!inner(profile_id)", { count: "exact", head: true })
                        .eq("application.profile_id", user.id)
                        .eq("status", OfferStatus.ACCEPTED),
                ])
                studentsCount = studentsRes.count ?? 0
                applicationsCount = applicationsRes.count ?? 0
                pendingCount = pendingRes.count ?? 0
                enrolledCount = enrolledRes.count ?? 0
            }
        } else if (userRole === Role.UNIVERSITY || userRole === Role.ADMIN) {
            const [studentsRes, applicationsRes, pendingRes, enrolledRes] = await Promise.all([
                supabase.from("student").select("id", { count: "exact", head: true }),
                supabase.from("application").select("id", { count: "exact", head: true }).eq("university_id", user.id),
                supabase.from("application").select("id", { count: "exact", head: true }).eq("university_id", user.id).eq("status", AppStatus.PENDING),
                supabase.from("offer_letter").select("id, application!inner(university_id)", { count: "exact", head: true })
                    .eq("application.university_id", user.id)
                    .eq("status", OfferStatus.ACCEPTED)
            ])
            console.log("Enrolled Res Error:", user.id, enrolledRes.error)
            console.log("Enrolled Res Count:", enrolledRes.count)
            studentsCount = studentsRes.count ?? 0
            applicationsCount = applicationsRes.count ?? 0
            pendingCount = pendingRes.count ?? 0
            enrolledCount = enrolledRes.count ?? 0
        }

        return NextResponse.json({
            data: {
                total_students: studentsCount,
                active_applications: applicationsCount,
                pending_actions: pendingCount,
                total_enrolled: enrolledCount,
            },
        }, { status: 200 })
    } catch (e) {
        console.error("GET /api/dashboard/stats error:", e)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
