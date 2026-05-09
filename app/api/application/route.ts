import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { CreateApplicationSchema } from "@/types/schemas/application";

export async function GET(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const studentId = searchParams.get("student_id");
        const limit = searchParams.get("limit");

        // Build query — join student profile, program name, and agent name
        let query = supabase
            .from("application")
            .select(`
                id,
                application_no,
                status,
                created_at,
                student:profile_id ( id, name, avatar_url, email ),
                program:program_id ( id, name ),
                agent:submitted_by_profile_id ( id, name )
            `)
            .order("created_at", { ascending: false });

        if (studentId) {
            // Filter by specific student (used on student detail page)
            query = query.eq("profile_id", studentId);
        } else {
            // Default: all applications submitted by this agent
            query = query.eq("submitted_by_profile_id", user.id);
        }

        if (limit) {
            query = query.limit(parseInt(limit, 10));
        }

        const { data: applications, error } = await query;

        if (error) {
            console.error("GET /api/application error:", error);
            return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
        }

        return NextResponse.json({ data: applications ?? [] }, { status: 200 });
    } catch (e) {
        console.error("GET /api/application error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validatedData = CreateApplicationSchema.parse(body);

        // Verify the profile making the request is an AGENT or the STUDENT themselves
        const { data: profile } = await supabase
            .from("profile")
            .select("id, role")
            .eq("id", user.id)
            .maybeSingle();

        if (!profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 403 });
        }

        // Use admin client to bypass RLS for insertion
        const adminSupabase = await createSupabaseAdminClient();

        // Insert into application table
        const { data: application, error } = await adminSupabase
            .from("application")
            .insert({
                profile_id: validatedData.profile_id,
                program_id: validatedData.program_id,
                university_id: validatedData.university_id,
                status: "PENDING",
                submitted_by_profile_id: user.id
            })
            .select()
            .single();

        if (error) {
            console.error("Failed to create application:", error);
            return NextResponse.json({ error: "Failed to create application", details: error }, { status: 400 });
        }

        return NextResponse.json({ data: application, message: "Application created successfully" }, { status: 201 });

    } catch (e: any) {
        if (e?.name === "ZodError") {
            return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 });
        }
        console.error("POST /api/application error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
