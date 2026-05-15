import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Fetch user role
        const { data: profile } = await supabase
            .from("profile")
            .select("role")
            .eq("id", user.id)
            .single();

        // Fetch application with related data
        let query = supabase
            .from("application")
            .select(`
                *,
                student:profile_id ( id, name, avatar_url, email, date_of_birth, gender ),
                program:program_id ( *, campus_program_junction ( * ) ),
                university:university_id ( * ),
                agent:submitted_by_profile_id ( id, name ),
                documents:application_document (
                    document:document_id (
                        id,
                        name,
                        created_at,
                        document_files ( file_url, type ),
                        document_review ( status, feedback )
                    )
                )
            `)
            .eq("id", id);

        // Role-based filtering
        if (profile?.role === "STUDENT") {
            query = query.eq("profile_id", user.id);
        } else if (profile?.role === "AGENT") {
            query = query.eq("submitted_by_profile_id", user.id);
        } else if (profile?.role === "UNIVERSITY") {
            query = query.eq("university_id", user.id);
        }

        const { data: application, error } = await query.single();

        if (error) {
            console.error("GET /api/application/[id] error:", error);
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        return NextResponse.json({ data: application }, { status: 200 });
    } catch (e) {
        console.error("GET /api/application/[id] error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
