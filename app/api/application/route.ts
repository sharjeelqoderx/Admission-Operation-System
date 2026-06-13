import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CreateApplicationSchema, ApplicationListQuerySchema } from "@/types/schemas/application";
import {
    attachLevelsToCourses,
    COURSE_SELECT,
    type CourseRow,
} from "@/lib/api/course-program";
import { formatFullName, withProfileDisplayName } from "@/lib/utils/profile";

const APPLICATION_LIST_SELECT = `
    id,
    application_no,
    status,
    created_at,
    course_id,
    student:profile_id ( id, first_name, last_name, avatar_url, email ),
    agent:submitted_by_profile_id ( id, first_name, last_name )
`;

type ApplicationListRow = {
    id: string;
    application_no: string | null;
    status: string;
    created_at: string;
    course_id: string;
    student: {
        id: string;
        first_name: string | null;
        last_name: string | null;
        name?: string | null;
        avatar_url: string | null;
        email: string | null;
    } | null;
    agent: { id: string; first_name: string | null; last_name: string | null; name?: string | null } | null;
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

function getRequiredDocumentTypeIds(
    degree: {
        requirements?: Array<{ document_type?: { id: string } | null }> | null
    } | null
): string[] {
    if (!degree?.requirements?.length) return [];

    return degree.requirements
        .map((item) => item.document_type?.id)
        .filter((id): id is string => Boolean(id));
}

function computeDocumentVault(
    profileId: string | undefined,
    requiredTypeIds: string[],
    uploadedByProfile: Map<string, Set<string>>
) {
    const total = requiredTypeIds.length;

    if (!profileId || total === 0) {
        return {
            documents_uploaded_count: 0,
            total_required_documents: total,
            document_vault_percentage: total === 0 ? 100 : 0,
        };
    }

    const uploadedSet = uploadedByProfile.get(profileId) ?? new Set<string>();
    const uploadedCount = requiredTypeIds.filter((id) => uploadedSet.has(id)).length;

    return {
        documents_uploaded_count: uploadedCount,
        total_required_documents: total,
        document_vault_percentage: Math.round((uploadedCount / total) * 100),
    };
}

async function buildUploadedDocumentsByProfile(
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
    profileIds: string[]
) {
    const uploadedByProfile = new Map<string, Set<string>>();

    if (profileIds.length === 0) {
        return uploadedByProfile;
    }

    const { data: documents, error } = await supabase
        .from("document")
        .select("profile_id, document_type_id")
        .in("profile_id", profileIds)
        .not("document_type_id", "is", null);

    if (error) {
        throw error;
    }

    for (const doc of documents ?? []) {
        if (!doc.document_type_id) continue;
        const existing = uploadedByProfile.get(doc.profile_id) ?? new Set<string>();
        existing.add(doc.document_type_id);
        uploadedByProfile.set(doc.profile_id, existing);
    }

    return uploadedByProfile;
}

async function buildOffersByApplicationId(
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
    applicationIds: string[]
) {
    const offerByApplicationId = new Map<string, { status: string }>();

    if (applicationIds.length === 0) {
        return offerByApplicationId;
    }

    const { data: offers, error } = await supabase
        .from("offer_letter")
        .select("application_id, status")
        .in("application_id", applicationIds);

    if (error) {
        throw error;
    }

    for (const offer of offers ?? []) {
        offerByApplicationId.set(offer.application_id, { status: offer.status });
    }

    return offerByApplicationId;
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
    const applicationIds = applications.map((application) => application.id);
    const offerByApplicationId = await buildOffersByApplicationId(supabase, applicationIds);
    const uploadedByProfile = await buildUploadedDocumentsByProfile(supabase, profileIds);

    const courseIds = [
        ...new Set(applications.map((application) => application.course_id).filter(Boolean)),
    ];

    if (courseIds.length === 0) {
        return applications.map((application) => {
            const vault = computeDocumentVault(
                application.student?.id,
                [],
                uploadedByProfile
            );
            const offer = offerByApplicationId.get(application.id);

            return {
                id: application.id,
                application_no: application.application_no,
                status: application.status,
                created_at: application.created_at,
                offer_shared: Boolean(offer),
                offer_status: offer?.status ?? null,
                ...vault,
                student: application.student
                    ? {
                          ...withProfileDisplayName(application.student)!,
                          student_code:
                              studentCodeByProfile.get(application.student.id) ?? null,
                      }
                    : null,
                agent: withProfileDisplayName(application.agent),
                course: null,
            };
        });
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
            requirements?: Array<{ document_type?: { id: string } | null }> | null
        } | null;
        const requiredTypeIds = getRequiredDocumentTypeIds(degree);
        const vault = computeDocumentVault(
            application.student?.id,
            requiredTypeIds,
            uploadedByProfile
        );
        const offer = offerByApplicationId.get(application.id);

        return {
            id: application.id,
            application_no: application.application_no,
            status: application.status,
            created_at: application.created_at,
            offer_shared: Boolean(offer),
            offer_status: offer?.status ?? null,
            ...vault,
            student: application.student
                ? {
                      ...withProfileDisplayName(application.student)!,
                      student_code:
                          studentCodeByProfile.get(application.student.id) ?? null,
                  }
                : null,
            agent: withProfileDisplayName(application.agent),
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

async function resolveCourseIdsForDegree(
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
    degreeId: string
) {
    const { data: courses, error } = await supabase
        .from("course")
        .select("id")
        .eq("degree_id", degreeId);

    if (error) {
        throw error;
    }

    return (courses ?? []).map((course) => course.id);
}

async function resolveMatchingStudentProfileIds(
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
    searchTerm: string,
    options: {
        role: string;
        userId: string;
        studentId?: string;
    }
) {
    if (options.studentId) {
        return [options.studentId];
    }

    const escaped = searchTerm.replace(/[%_,]/g, "\\$&");
    const pattern = `%${escaped}%`;

    if (options.role === "STUDENT") {
        const { data: profile, error } = await supabase
            .from("profile")
            .select("id, first_name, last_name, email")
            .eq("id", options.userId)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!profile) {
            return [];
        }

        const displayName = formatFullName(profile.first_name, profile.last_name);
        const haystack = `${displayName} ${profile.email ?? ""}`.toLowerCase();
        return haystack.includes(searchTerm.toLowerCase()) ? [profile.id] : [];
    }

    let allowedProfileIds: string[] | null = null;

    if (options.role === "AGENT") {
        const { data: agentRow, error: agentError } = await supabase
            .from("agent")
            .select("id")
            .eq("profile_id", options.userId)
            .maybeSingle();

        if (agentError) {
            throw agentError;
        }

        if (!agentRow) {
            return [];
        }

        const { data: students, error: studentsError } = await supabase
            .from("student")
            .select("profile_id")
            .eq("created_by_agent_id", agentRow.id);

        if (studentsError) {
            throw studentsError;
        }

        allowedProfileIds = (students ?? [])
            .map((student) => student.profile_id)
            .filter(Boolean);

        if (allowedProfileIds.length === 0) {
            return [];
        }
    }

    let profileQuery = supabase
        .from("profile")
        .select("id")
        .or(`first_name.ilike.${pattern},last_name.ilike.${pattern},email.ilike.${pattern}`);

    if (allowedProfileIds) {
        profileQuery = profileQuery.in("id", allowedProfileIds);
    }

    const { data: profiles, error } = await profileQuery;

    if (error) {
        throw error;
    }

    return (profiles ?? []).map((profile) => profile.id);
}

type ApplicationFilterContext = {
    userId: string;
    role: string;
    studentId?: string;
    dateFrom?: string;
    dateTo?: string;
    filteredCourseIds?: string[] | null;
    filteredProfileIds?: string[] | null;
};

const EMPTY_APPLICATION_STATS = {
    total: 0,
    pending: 0,
    accepted: 0,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyApplicationFilters(query: any, ctx: ApplicationFilterContext) {
    let nextQuery = query;

    if (ctx.studentId) {
        nextQuery = nextQuery.eq("profile_id", ctx.studentId);
    } else if (ctx.role === "STUDENT") {
        nextQuery = nextQuery.eq("profile_id", ctx.userId);
    } else if (ctx.role === "AGENT") {
        nextQuery = nextQuery.eq("submitted_by_profile_id", ctx.userId);
    } else if (ctx.role === "UNIVERSITY") {
        nextQuery = nextQuery.eq("university_id", ctx.userId);
    }

    if (ctx.dateFrom) {
        nextQuery = nextQuery.gte("created_at", `${ctx.dateFrom}T00:00:00.000Z`);
    }

    if (ctx.dateTo) {
        nextQuery = nextQuery.lte("created_at", `${ctx.dateTo}T23:59:59.999Z`);
    }

    if (ctx.filteredCourseIds) {
        nextQuery = nextQuery.in("course_id", ctx.filteredCourseIds);
    }

    if (ctx.filteredProfileIds) {
        nextQuery = nextQuery.in("profile_id", ctx.filteredProfileIds);
    }

    return nextQuery;
}

async function fetchApplicationStats(
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
    ctx: ApplicationFilterContext
) {
    const baseQuery = applyApplicationFilters(
        supabase.from("application").select("id", { count: "exact", head: true }),
        ctx
    );

    const [totalResult, pendingResult, acceptedResult] = await Promise.all([
        baseQuery,
        applyApplicationFilters(
            supabase.from("application").select("id", { count: "exact", head: true }),
            ctx
        ).eq("status", "PENDING"),
        applyApplicationFilters(
            supabase.from("application").select("id", { count: "exact", head: true }),
            ctx
        ).eq("status", "APPROVED"),
    ]);

    if (totalResult.error) throw totalResult.error;
    if (pendingResult.error) throw pendingResult.error;
    if (acceptedResult.error) throw acceptedResult.error;

    return {
        total: totalResult.count ?? 0,
        pending: pendingResult.count ?? 0,
        accepted: acceptedResult.count ?? 0,
    };
}

export async function GET(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const queryParse = ApplicationListQuerySchema.safeParse({
            student_id: searchParams.get("student_id") ?? undefined,
            limit: searchParams.get("limit") ?? undefined,
            status: searchParams.get("status") ?? undefined,
            degree_id: searchParams.get("degree_id") ?? undefined,
            date_from: searchParams.get("date_from") ?? undefined,
            date_to: searchParams.get("date_to") ?? undefined,
            q: searchParams.get("q") ?? undefined,
        });

        if (!queryParse.success) {
            return NextResponse.json(
                {
                    error: "Invalid query parameters",
                    details: queryParse.error.flatten(),
                },
                { status: 400 }
            );
        }

        const {
            student_id: studentId,
            limit,
            status,
            degree_id: degreeId,
            date_from: dateFrom,
            date_to: dateTo,
            q: searchTerm,
        } = queryParse.data;

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

        let filteredCourseIds: string[] | null = null;
        let filteredProfileIds: string[] | null = null;

        if (degreeId) {
            filteredCourseIds = await resolveCourseIdsForDegree(supabase, degreeId);
            if (filteredCourseIds.length === 0) {
                return NextResponse.json(
                    { data: [], stats: EMPTY_APPLICATION_STATS, role: profile.role },
                    { status: 200 }
                );
            }
        }

        if (searchTerm) {
            filteredProfileIds = await resolveMatchingStudentProfileIds(supabase, searchTerm, {
                role: profile.role,
                userId: user.id,
                studentId,
            });

            if (filteredProfileIds.length === 0) {
                return NextResponse.json(
                    { data: [], stats: EMPTY_APPLICATION_STATS, role: profile.role },
                    { status: 200 }
                );
            }
        }

        const filterContext: ApplicationFilterContext = {
            userId: user.id,
            role: profile.role,
            studentId,
            dateFrom,
            dateTo,
            filteredCourseIds,
            filteredProfileIds,
        };

        const stats = await fetchApplicationStats(supabase, filterContext);

        let query = applyApplicationFilters(
            supabase.from("application").select(APPLICATION_LIST_SELECT),
            filterContext
        ).order("created_at", { ascending: false });

        if (status && status !== "all") {
            query = query.eq("status", status);
        }

        if (limit) {
            query = query.limit(limit);
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

        return NextResponse.json(
            { data: result, stats, role: profile.role },
            { status: 200 }
        );
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
