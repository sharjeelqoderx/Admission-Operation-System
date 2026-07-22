import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { fetchApplicationsList } from "@/lib/application/list"
import { CreateApplicationSchema, ApplicationListQuerySchema } from "@/types/schemas/application"
import type { ApplicationProfileRole } from "@/types/schemas/application"
import { isUniversityStaffRole } from "@/lib/auth/university-role"
import { resubmitApplicationById } from "@/lib/application/resubmit"
import { Role } from "@/types/enums/role"

async function canAccessStudentApplications(
    _supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
    userId: string,
    role: string | undefined,
    studentId: string
) {
    if (role === Role.STUDENT) {
        return userId === studentId
    }

    // Agents have staff-wide visibility (same as all-apps / students / offers).
    return role === Role.AGENT || isUniversityStaffRole(role)
}

export async function GET(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const queryParse = ApplicationListQuerySchema.safeParse({
            student_id: searchParams.get("student_id") ?? undefined,
            page: searchParams.get("page") ?? undefined,
            limit: searchParams.get("limit") ?? undefined,
            status: searchParams.get("status") ?? undefined,
            degree_id: searchParams.get("degree_id") ?? undefined,
            date_from: searchParams.get("date_from") ?? undefined,
            date_to: searchParams.get("date_to") ?? undefined,
            q: searchParams.get("q") ?? undefined,
            scope: searchParams.get("scope") ?? undefined,
        })

        if (!queryParse.success) {
            return NextResponse.json(
                {
                    error: "Invalid query parameters",
                    details: queryParse.error.flatten(),
                },
                { status: 400 }
            )
        }

        const { student_id: studentId } = queryParse.data

        const { data: profile, error: profileError } = await supabase
            .from("profile")
            .select("role")
            .eq("id", user.id)
            .single()

        if (profileError || !profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 403 })
        }

        const role = profile.role as ApplicationProfileRole

        if (queryParse.data.scope === "all" && role === Role.STUDENT) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        if (studentId) {
            const allowed = await canAccessStudentApplications(
                supabase,
                user.id,
                profile.role,
                studentId
            )

            if (!allowed) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 })
            }
        }

        const result = await fetchApplicationsList(supabase, {
            ...queryParse.data,
            userId: user.id,
            role,
        })

        if ("error" in result) {
            if (result.error === "Forbidden") {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 })
            }

            console.error("GET /api/application error:", result.error)
            return NextResponse.json(
                {
                    error: "Failed to fetch applications",
                    message: result.error,
                },
                { status: 500 }
            )
        }

        return NextResponse.json(
            { data: result.data, stats: result.stats, role: result.role },
            { status: 200 }
        )
    } catch (e) {
        console.error("GET /api/application error:", e)
        const message = e instanceof Error ? e.message : "Unknown error occurred"
        return NextResponse.json(
            { error: "Internal Server Error", message },
            { status: 500 }
        )
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const validatedData = CreateApplicationSchema.parse(body)

        const { data: profile } = await supabase
            .from("profile")
            .select("id, role")
            .eq("id", user.id)
            .maybeSingle()

        if (!profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 403 })
        }

        const { data: course } = await supabase
            .from("course")
            .select("id")
            .eq("id", validatedData.course_id)
            .eq("is_deleted", false)
            .maybeSingle()

        if (!course) {
            return NextResponse.json({ error: "Selected course not found" }, { status: 400 })
        }

        const { data: rejectedApp } = await supabase
            .from("application")
            .select("id, status, profile_id, submitted_by_profile_id")
            .eq("profile_id", validatedData.profile_id)
            .eq("course_id", validatedData.course_id)
            .eq("status", "REJECTED")
            .maybeSingle()

        if (rejectedApp) {
            const resubmitResult = await resubmitApplicationById(supabase, {
                applicationId: rejectedApp.id,
                userId: user.id,
                role: profile.role as ApplicationProfileRole,
                documentIds: validatedData.document_ids ?? [],
            })

            if ("error" in resubmitResult) {
                if (resubmitResult.error === "forbidden") {
                    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
                }

                return NextResponse.json({ error: "Application not found" }, { status: 404 })
            }

            return NextResponse.json(
                {
                    data: resubmitResult.application,
                    message: "Application resubmitted successfully",
                },
                { status: 200 }
            )
        }

        const { data: existingApp } = await supabase
            .from("application")
            .select("id")
            .eq("profile_id", validatedData.profile_id)
            .eq("course_id", validatedData.course_id)
            .neq("status", "REJECTED")
            .maybeSingle()

        if (existingApp) {
            return NextResponse.json(
                { error: "Application is already created for this course" },
                { status: 400 }
            )
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
            .single()

        if (insertError) {
            console.error("Database Insert Error:", insertError)
            return NextResponse.json(
                {
                    error: "Failed to create application",
                    message: insertError.message,
                    details: insertError,
                },
                { status: 400 }
            )
        }

        if (validatedData.document_ids && validatedData.document_ids.length > 0) {
            const documentLinks = validatedData.document_ids.map((docId) => ({
                application_id: application.id,
                document_id: docId,
            }))

            const { error: docLinkError } = await supabase
                .from("application_document")
                .insert(documentLinks)

            if (docLinkError) {
                console.error("Document Linking Error:", docLinkError)
            }
        }

        return NextResponse.json(
            {
                data: application,
                message: "Application created successfully",
            },
            { status: 201 }
        )
    } catch (e: unknown) {
        console.error("CRITICAL: POST /api/application error:", e)

        if (e && typeof e === "object" && "name" in e && e.name === "ZodError" && "errors" in e) {
            return NextResponse.json(
                {
                    error: "Validation failed",
                    details: e.errors,
                },
                { status: 400 }
            )
        }

        const message = e instanceof Error ? e.message : "Unknown error occurred"
        return NextResponse.json(
            {
                error: "Internal Server Error",
                message,
            },
            { status: 500 }
        )
    }
}
