import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
    createSupabaseServerClient,
    createSupabaseServiceClient,
} from "@/lib/supabase/server"
import { DocumentFormSchema } from "@/types/schemas/document"
import { formatFullName } from "@/lib/utils/profile"
import { assertCanUploadStudentDocument } from "@/lib/document/agent-access"
import { isUniversityStaffRole } from "@/lib/auth/university-role"
import {
    applyUniversityIdFilter,
    resolveUniversityApplicationScope,
} from "@/lib/auth/university-scope"
import { saveDocumentUpload } from "@/lib/supabase/save-document-upload"
import { paginateDocumentRows, parseDocumentPageLimit } from "@/lib/document/paginate"
import { rpcDocumentStudentsList } from "@/lib/rpc/dashboard"
import { Role } from "@/types/enums/role"

export async function GET(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()
        const { searchParams } = new URL(req.url)
        const search = searchParams.get("search")?.toLowerCase()
        const status = searchParams.get("status")
        const { page, limit } = parseDocumentPageLimit(searchParams)

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

            const studentRows = [
                {
                    student_id: user.id,
                    student_name: formatFullName(studentProfile?.first_name, studentProfile?.last_name, "—"),
                    student_code: studentRow?.student_code ?? null,
                    avatar_url: studentProfile?.avatar_url ?? null,
                    document_count: docs.length,
                    last_uploaded_at: lastDoc?.created_at ?? null,
                    last_doc_status: lastDoc?.document_review?.[0]?.status ?? null,
                },
            ]
            const paged = paginateDocumentRows(studentRows, page, limit)

            return NextResponse.json(
                {
                    data: paged.data,
                    pagination: paged.pagination,
                    role: Role.STUDENT,
                },
                { status: 200 }
            )
        }
 
        const staffRole = profile?.role
        let agentId: string | undefined
        let profileIds: string[] | null = null

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

            agentId = agentRow.id
        } else if (isUniversityStaffRole(profile?.role)) {
            const scope = await resolveUniversityApplicationScope(
                supabase,
                user.id,
                profile?.role
            )

            if (scope.universityIds !== null) {
                let applicationsQuery = supabase.from("application").select("profile_id")
                applicationsQuery = applyUniversityIdFilter(
                    applicationsQuery,
                    "university_id",
                    scope
                )

                const { data: applications, error: applicationsError } = await applicationsQuery

                if (applicationsError) {
                    console.error("applications error:", applicationsError)
                    return NextResponse.json(
                        { error: "Failed to fetch students", details: applicationsError },
                        { status: 500 }
                    )
                }

                profileIds = [
                    ...new Set(
                        (applications ?? [])
                            .map((application) => application.profile_id)
                            .filter(Boolean)
                    ),
                ]

                if (profileIds.length === 0) {
                    return NextResponse.json(
                        {
                            data: [],
                            pagination: { total: 0, page: 1, limit, totalPages: 0 },
                            role: staffRole,
                        },
                        { status: 200 }
                    )
                }
            }
        } else {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const rpcResult = await rpcDocumentStudentsList(supabase, {
            profileIds,
            agentId,
            search: search ?? "",
            status: status ?? "all",
            page,
            limit,
        })

        return NextResponse.json(
            {
                data: rpcResult.data.map((row) => ({
                    ...row,
                    student_name: row.student_name || "—",
                })),
                pagination: rpcResult.pagination,
                role: staffRole,
            },
            { status: 200 }
        )
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
