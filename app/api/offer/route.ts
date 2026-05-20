import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
    try {
        // Step 1: Validate auth with regular client (respects RLS for auth check)
        const supabase = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Step 2: Get user's role
        const { data: profile } = await supabase
            .from("profile")
            .select("role")
            .eq("id", user.id)
            .single();

        // Step 3: Use admin client to bypass RLS for data fetching
        const adminSupabase = await createSupabaseAdminClient();

        let query = adminSupabase
            .from("offer_letter")
            .select(`
                id,
                status,
                created_at,
                application!inner (
                    id,
                    application_no,
                    profile_id,
                    submitted_by_profile_id,
                    university_id,
                    student:profile_id ( id, name, avatar_url, email ),
                    program:program_id ( id, name ),
                    university:university_id ( id, name )
                )
            `)
            .order("created_at", { ascending: false });

        const { data: offers, error } = await query;

        if (error) {
            console.error("GET /api/offer error:", error);
            return NextResponse.json({ error: "Failed to fetch offers", details: error.message }, { status: 500 });
        }

        // Step 4: Filter in application code based on role
        let filtered = offers ?? [];

        if (profile?.role === "STUDENT") {
            filtered = filtered.filter((o: any) => o.application?.profile_id === user.id);
        } else if (profile?.role === "AGENT") {
            filtered = filtered.filter((o: any) => o.application?.submitted_by_profile_id === user.id);
        } else if (profile?.role === "UNIVERSITY") {
            filtered = filtered.filter((o: any) => o.application?.university_id === user.id);
        }
        // ADMIN sees all

        return NextResponse.json({ data: filtered }, { status: 200 });
    } catch (e) {
        console.error("GET /api/offer error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
