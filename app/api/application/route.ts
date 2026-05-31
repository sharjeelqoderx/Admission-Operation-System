import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CreateApplicationSchema } from "@/types/schemas/application";
import {
    attachLevelsToCourses,
    COURSE_SELECT,
    type CourseRow,
} from "@/lib/api/course-program";

const APPLICATION_LIST_SELECT = `
    id,
    application_no,
    status,
    created_at,
    course_id,
    student:profile_id ( id, name, avatar_url, email ),
    agent:submitted_by_profile_id ( id, name )
`;

type ApplicationListRow = {
    id: string;
    application_no: string | null;
    status: string;
    created_at: string;
    course_id: string;
    student: {
        id: string;
        name: string | null;
        avatar_url: string | null;
        email: string | null;
    } | null;
    agent: { id: string; name: string | null } | null;
};

async function attachStudentCodes(
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
    profileIds: string[]
) {
    if (profileIds.length === 0) {
        return new Map<string, string | null>();
    }

    const { data: students, error } = await supabase
        .from("student")
        .select("profile_id, student_code")
        .in("profile_id", profileIds);

    if (error) {
        throw error;
    }

    return new Map(
        (students ?? []).map((student) => [student.profile_id, student.student_code])
    );
}

async function attachCoursesToApplications(
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
    applications: ApplicationListRow[]
) {
    const profileIds = [
        ...new Set(
            applications
                .map((application) => application.student?.id)
                .filter((id): id is string => Boolean(id))
        ),
    ];
    const studentCodeByProfile = await attachStudentCodes(supabase, profileIds);

    const courseIds = [
        ...new Set(applications.map((application) => application.course_id).filter(Boolean)),
    ];

    if (courseIds.length === 0) {
        return applications.map((application) => ({
            id: application.id,
            application_no: application.application_no,
            status: application.status,
            created_at: application.created_at,
            student: application.student
                ? {
                      ...application.student,
                      student_code:
                          studentCodeByProfile.get(application.student.id) ?? null,
                  }
                : null,
            agent: application.agent,
            course: null,
        }));
    }

    const { data: courses, error } = await supabase
        .from("course")
        .select(COURSE_SELECT)
        .in("id", courseIds);

    if (error) {
        throw error;
    }

    const coursesWithLevels = await attachLevelsToCourses(
        supabase,
        (courses ?? []) as unknown as CourseRow[]
    );
    const courseById = new Map(coursesWithLevels.map((course) => [course.id, course]));

    return applications.map((application) => {
        const course = courseById.get(application.course_id) ?? null;
        const degree = course?.degree as unknown as {
            id: string
            name: string
            fees?: string | null
            intake_date?: string | null
        } | null;

        return {
            id: application.id,
            application_no: application.application_no,
            status: application.status,
            created_at: application.created_at,
            student: application.student
                ? {
                      ...application.student,
                      student_code:
                          studentCodeByProfile.get(application.student.id) ?? null,
                  }
                : null,
            agent: application.agent,
            course: course
                ? {
                      id: course.id,
                      name: course.name,
                      deadline_date: course.deadline_date,
                      degree: degree
                          ? {
                                id: degree.id,
                                name: degree.name,
                                fees: degree.fees ?? null,
                                intake_date: degree.intake_date ?? null,
                            }
                          : null,
                  }
                : null,
        };
    });
}

async function canAccessStudentApplications(
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
    userId: string,
    role: string | undefined,
    studentId: string
) {
    if (role === "STUDENT") {
        return userId === studentId;
    }

    if (role === "AGENT") {
        const { data: agentRow } = await supabase
            .from("agent")
            .select("id")
            .eq("profile_id", userId)
            .maybeSingle();

        if (!agentRow) {
            return false;
        }

        const { data: studentRow } = await supabase
            .from("student")
            .select("id")
            .eq("profile_id", studentId)
            .eq("created_by_agent_id", agentRow.id)
            .maybeSingle();

        return Boolean(studentRow);
    }

    return role === "UNIVERSITY" || role === "ADMIN";
}

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

        const { data: profile, error: profileError } = await supabase
            .from("profile")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 403 });
        }

        if (studentId) {
            const allowed = await canAccessStudentApplications(
                supabase,
                user.id,
                profile.role,
                studentId
            );

            if (!allowed) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        let query = supabase
            .from("application")
            .select(APPLICATION_LIST_SELECT)
            .order("created_at", { ascending: false });

        if (studentId) {
            query = query.eq("profile_id", studentId);
        } else if (profile.role === "STUDENT") {
            query = query.eq("profile_id", user.id);
        } else if (profile.role === "AGENT") {
            query = query.eq("submitted_by_profile_id", user.id);
        } else if (profile.role === "UNIVERSITY") {
            query = query.eq("university_id", user.id);
        }

        if (limit) {
            query = query.limit(parseInt(limit, 10));
        }

        const { data: applications, error } = await query;

        if (error) {
            console.error("GET /api/application error:", error);
            return NextResponse.json(
                {
                    error: "Failed to fetch applications",
                    message: error.message,
                    details: error,
                },
                { status: 500 }
            );
        }

        const result = await attachCoursesToApplications(
            supabase,
            (applications ?? []) as unknown as ApplicationListRow[]
        );

        return NextResponse.json({ data: result, role: profile.role }, { status: 200 });
    } catch (e) {
        console.error("GET /api/application error:", e);
        const message = e instanceof Error ? e.message : "Unknown error occurred";
        return NextResponse.json(
            { error: "Internal Server Error", message },
            { status: 500 }
        );
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

        const { data: profile } = await supabase
            .from("profile")
            .select("id, role")
            .eq("id", user.id)
            .maybeSingle();

        if (!profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 403 });
        }

        const { data: course } = await supabase
            .from("course")
            .select("id")
            .eq("id", validatedData.course_id)
            .maybeSingle();

        if (!course) {
            return NextResponse.json({ error: "Selected course not found" }, { status: 400 });
        }

        const { data: existingApp } = await supabase
            .from("application")
            .select("id")
            .eq("profile_id", validatedData.profile_id)
            .eq("course_id", validatedData.course_id)
            .neq("status", "REJECTED")
            .maybeSingle();
 
        if (existingApp) {
            return NextResponse.json({ error: "Application is already created for this course" }, { status: 400 });
        }

        const { data: application, error: insertError } = await supabase
            .from("application")
            .insert({
                profile_id: validatedData.profile_id,
                course_id: validatedData.course_id,
                university_id: validatedData.university_id,
                status: "PENDING",
                submitted_by_profile_id: user.id,
            })
            .select()
            .single();

        if (insertError) {
            console.error("Database Insert Error:", insertError);
            return NextResponse.json({ 
                error: "Failed to create application", 
                message: insertError.message,
                details: insertError 
            }, { status: 400 });
        }

        if (validatedData.document_ids && validatedData.document_ids.length > 0) {
            const documentLinks = validatedData.document_ids.map(docId => ({
                application_id: application.id,
                document_id: docId
            }));

            const { error: docLinkError } = await supabase
                .from("application_document")
                .insert(documentLinks);

            if (docLinkError) {
                console.error("Document Linking Error:", docLinkError);
            }
        }

        return NextResponse.json({ 
            data: application, 
            message: "Application created successfully" 
        }, { status: 201 });

    } catch (e: unknown) {
        console.error("CRITICAL: POST /api/application error:", e);
        
        if (e && typeof e === "object" && "name" in e && e.name === "ZodError" && "errors" in e) {
            return NextResponse.json({ 
                error: "Validation failed", 
                details: e.errors 
            }, { status: 400 });
        }
        
        const message = e instanceof Error ? e.message : "Unknown error occurred";
        return NextResponse.json({ 
            error: "Internal Server Error",
            message,
        }, { status: 500 });
    }
}
