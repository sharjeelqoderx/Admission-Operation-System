import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
    createSupabaseServerClient,
    createSupabaseServiceClient,
} from "@/lib/supabase/server"
import { DocumentFormSchema } from "@/types/schemas/document"
import { formatFullName } from "@/lib/utils/profile"
import { assertCanUploadStudentDocument } from "@/lib/document/agent-access"
import { isUniversityRole, isUniversityStaffRole } from "@/lib/auth/university-role"
import { saveDocumentUpload } from "@/lib/supabase/save-document-upload"
import { Role } from "@/types/enums/role"

export async function GET(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()
        const { searchParams } = new URL(req.url)
        const search = searchParams.get("search")?.toLowerCase()
        const status = searchParams.get("status")

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
 
        // Check user role
        const { data: profile } = await supabase
            .from("profile")
            .select("role")
            .eq("id", user.id)
            .single();
 
        if (profile?.role === Role.STUDENT) {
            const { data: studentProfile } = await supabase
                .from("profile")
                .select("id, first_name, last_name, avatar_url")
                .eq("id", user.id)
                .single()

            const { data: studentRow } = await supabase
                .from("student")
                .select("student_code")
                .eq("profile_id", user.id)
                .maybeSingle()

            let query = supabase
                .from("document")
                .select(`
                    id,
                    profile_id,
                    created_at,
                    document_review(status, created_at)
                `)
                .eq("profile_id", user.id)

            const { data: documents, error: docsError } = await query.order("created_at", {
                ascending: false,
            })

            if (docsError) {
                return NextResponse.json(
                    { error: "Failed to fetch documents", details: docsError },
                    { status: 500 }
                )
            }

            const docs = documents ?? []
            const lastDoc = docs.length
                ? [...docs].sort(
                      (a, b) =>
                          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                  )[0]
                : null

            return NextResponse.json(
                {
                    data: [
                        {
                            student_id: user.id,
                            student_name: formatFullName(studentProfile?.first_name, studentProfile?.last_name, "—"),
                            student_code: studentRow?.student_code ?? null,
                            avatar_url: studentProfile?.avatar_url ?? null,
                            document_count: docs.length,
                            last_uploaded_at: lastDoc?.created_at ?? null,
                            last_doc_status: lastDoc?.document_review?.[0]?.status ?? null,
                        },
                    ],
                    role: Role.STUDENT,
                },
                { status: 200 }
            )
        }
 
        const studentSelect = `
                id,
                profile_id,
                student_code,
                created_at,
                profile:profile_id (id, first_name, last_name, avatar_url)
            `

        let students: Array<{
            id: string
            profile_id: string
            student_code: string | null
            created_at: string
            profile: {
                id: string
                first_name: string | null
                last_name: string | null
                avatar_url: string | null
            } | null
        }> = []
        const staffRole = profile?.role

        if (profile?.role === Role.AGENT) {
            const { data: agentRow } = await supabase
                .from("agent")
                .select("id")
                .eq("profile_id", user.id)
                .maybeSingle()

            if (!agentRow) {
                return NextResponse.json(
                    { error: "University Partner profile not found" },
                    { status: 400 }
                )
            }

            const { data: agentStudents, error: studentsError } = await supabase
                .from("student")
                .select(studentSelect)
                .eq("created_by_agent_id", agentRow.id)
                .order("created_at", { ascending: false })

            if (studentsError) {
                console.error("students error:", studentsError)
                return NextResponse.json(
                    { error: "Failed to fetch students", details: studentsError },
                    { status: 500 }
                )
            }

            students = (agentStudents ?? []) as unknown as typeof students
        } else if (isUniversityStaffRole(profile?.role)) {
            let studentsQuery = supabase
                .from("student")
                .select(studentSelect)
                .order("created_at", { ascending: false })

            if (isUniversityRole(profile?.role)) {
                const { data: applications, error: applicationsError } = await supabase
                    .from("application")
                    .select("profile_id")
                    .eq("university_id", user.id)

                if (applicationsError) {
                    console.error("applications error:", applicationsError)
                    return NextResponse.json(
                        { error: "Failed to fetch students", details: applicationsError },
                        { status: 500 }
                    )
                }

                const profileIds = [
                    ...new Set(
                        (applications ?? [])
                            .map((application) => application.profile_id)
                            .filter(Boolean)
                    ),
                ]

                if (profileIds.length === 0) {
                    return NextResponse.json({ data: [], role: staffRole }, { status: 200 })
                }

                studentsQuery = studentsQuery.in("profile_id", profileIds)
            }

            const { data: staffStudents, error: studentsError } = await studentsQuery

            if (studentsError) {
                console.error("students error:", studentsError)
                return NextResponse.json(
                    { error: "Failed to fetch students", details: studentsError },
                    { status: 500 }
                )
            }

            students = (staffStudents ?? []) as unknown as typeof students
        } else {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        if (!students.length) {
            return NextResponse.json({ data: [], role: staffRole }, { status: 200 })
        }

        const profileIds = students.map((student) => student.profile_id)

        const { data: documents, error: docsError } = await supabase
            .from("document")
            .select(
                "id, profile_id, document_type_id, document_type:document_type_id(name), created_at, document_review(status, created_at), document_files(file_url, type)"
            )
            .in("profile_id", profileIds)
            .order("created_at", { ascending: false })

        if (docsError) {
            console.error("documents error:", docsError)
            return NextResponse.json(
                { error: "Failed to fetch documents", details: docsError },
                { status: 500 }
            )
        }

        const result = students
            .map((student) => {
                const docs = (documents ?? []).filter(
                    (document) => document.profile_id === student.profile_id
                )

                const profileName = formatFullName(
                    student.profile?.first_name,
                    student.profile?.last_name
                ).toLowerCase()
                const studentCode = (student.student_code ?? "").toLowerCase()
                if (
                    search &&
                    !profileName.includes(search) &&
                    !studentCode.includes(search)
                ) {
                    return null
                }

                const lastDoc = docs.length
                    ? [...docs].sort(
                          (a, b) =>
                              new Date(b.created_at).getTime() -
                              new Date(a.created_at).getTime()
                      )[0]
                    : null

                const lastStatus = lastDoc?.document_review?.[0]?.status ?? null

                if (status && status.toLowerCase() !== "all" && lastStatus !== status) return null

                return {
                    student_id: student.profile_id,
                    student_name: formatFullName(
                        student.profile?.first_name,
                        student.profile?.last_name,
                        "—"
                    ),
                    student_code: student.student_code ?? null,
                    avatar_url: student.profile?.avatar_url ?? null,
                    document_count: docs.length,
                    last_uploaded_at: lastDoc?.created_at ?? null,
                    last_doc_status: lastStatus,
                }
            })
            .filter(Boolean)
            .sort((a, b) => {
                const aTime = a?.last_uploaded_at
                    ? new Date(a.last_uploaded_at).getTime()
                    : 0
                const bTime = b?.last_uploaded_at
                    ? new Date(b.last_uploaded_at).getTime()
                    : 0
                return bTime - aTime
            })

        return NextResponse.json({ data: result, role: staffRole }, { status: 200 })
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabaseAuth = await createSupabaseServerClient()
        const supabaseService = createSupabaseServiceClient()

        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const formData = await req.formData()

        const rawFiles = formData.getAll("files")
        const files = rawFiles.filter((file): file is File => file instanceof File)

        const validated = DocumentFormSchema.parse({
            student_id: formData.get("student_id") ?? "",
            document_type_id: formData.get("document_type_id") ?? "",
            files,
            comment: formData.get("comment") ?? undefined,
        })

        const { data: profile, error: profileError } = await supabaseAuth
            .from("profile")
            .select("role")
            .eq("id", user.id)
            .maybeSingle()

        if (profileError) {
            return NextResponse.json({ error: profileError.message }, { status: 500 })
        }

        const canUpload = await assertCanUploadStudentDocument(
            supabaseAuth,
            user.id,
            profile?.role,
            validated.student_id
        )

        if (!canUpload) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const document = await saveDocumentUpload({
            supabase: supabaseService,
            studentProfileId: validated.student_id,
            uploadedByProfileId: user.id,
            documentTypeId: validated.document_type_id,
            files: validated.files,
        })

        return NextResponse.json(
            { data: document, message: "Document uploaded successfully" },
            { status: 201 }
        )
    } catch (e: unknown) {
        if (e instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: e.issues },
                { status: 400 }
            )
        }

        console.error("POST /api/document error:", e)

        const message = e instanceof Error ? e.message : "Internal Server Error"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
