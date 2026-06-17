import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { formatFullName, withProfileDisplayName } from "@/lib/utils/profile"
import { canAgentAccessApplication } from "@/lib/api/agent-applications"

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
        const { searchParams } = new URL(req.url);
        const viewScope = searchParams.get("scope") === "all" ? "all" : undefined;

        const { data: profile } = await supabase
            .from("profile")
            .select("role")
            .eq("id", user.id)
            .single();

        if (viewScope === "all" && profile?.role === "STUDENT") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        let query = supabase
            .from("application")
            .select(`
                *,
                student:profile_id ( id, first_name, last_name, avatar_url, email, date_of_birth, gender ),
                course:course_id (
                    id,
                    name,
                    deadline_date,
                    degree:degree_id (
                        id,
                        name,
                        fees,
                        intake_date,
                        duration,
                        location,
                        language_of_study,
                        study_mode
                    )
                ),
                university:university_id ( * ),
                agent:submitted_by_profile_id ( id, first_name, last_name ),
                documents:application_document (
                    document:document_id (
                        id,
                        created_at,
                        document_type:document_type_id ( id, name ),
                        document_files ( file_url, type ),
                        document_review ( status, feedback )
                    )
                )
            `)
            .eq("id", id);

        const { data: application, error } = await query.single();

        if (error || !application) {
            console.error("GET /api/application/[id] error:", error);
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        if (profile?.role === "STUDENT" && application.profile_id !== user.id) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        if (profile?.role === "AGENT" && viewScope !== "all") {
            const allowed = await canAgentAccessApplication(supabase, user.id, {
                profile_id: application.profile_id,
                submitted_by_profile_id: application.submitted_by_profile_id,
            });

            if (!allowed) {
                return NextResponse.json({ error: "Application not found" }, { status: 404 });
            }
        }

        if (profile?.role === "UNIVERSITY" && viewScope !== "all" && application.university_id !== user.id) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        const mappedApplication = application
            ? {
                ...application,
                student: withProfileDisplayName(application.student as { first_name?: string | null; last_name?: string | null } | null),
                agent: withProfileDisplayName(application.agent as { first_name?: string | null; last_name?: string | null } | null),
            }
            : application;

        return NextResponse.json({ data: mappedApplication }, { status: 200 });
    } catch (e) {
        console.error("GET /api/application/[id] error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
