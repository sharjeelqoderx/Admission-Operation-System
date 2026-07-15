import { NextResponse } from "next/server"
import {
    createSupabaseServerClient,
    createSupabaseServiceClient,
} from "@/lib/supabase/server"

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

        if (profile?.role !== "AGENT") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        // Agents see system-wide ops stats (same visibility as all-apps / offers / docs).
        const db = createSupabaseServiceClient()

        const [studentsResult, applicationsResult, pendingResult] = await Promise.all([
            db.from("student").select("id", { count: "exact", head: true }),
            db.from("application").select("id", { count: "exact", head: true }),
            db
                .from("application")
                .select("id", { count: "exact", head: true })
                .eq("status", "PENDING"),
        ])

        if (studentsResult.error || applicationsResult.error || pendingResult.error) {
            console.error("GET /api/dashboard/stats query error:", {
                students: studentsResult.error?.message,
                applications: applicationsResult.error?.message,
                pending: pendingResult.error?.message,
            })
            return NextResponse.json(
                { error: "Failed to fetch dashboard stats" },
                { status: 500 }
            )
        }

        return NextResponse.json(
            {
                data: {
                    total_students: studentsResult.count ?? 0,
                    active_applications: applicationsResult.count ?? 0,
                    pending_actions: pendingResult.count ?? 0,
                },
            },
            { status: 200 }
        )
    } catch (e) {
        console.error("GET /api/dashboard/stats error:", e)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
