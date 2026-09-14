import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server"
import { resolveAgentStudentProfileIds } from "@/lib/api/agent-applications"
import {
    applyUniversityIdFilter,
    resolveUniversityApplicationScope,
} from "@/lib/auth/university-scope"
import { isUniversityStaffRole } from "@/lib/auth/university-role"
import { formatFullName } from "@/lib/utils/profile"
import type { AgentAllDocumentRow } from "@/types/schemas/document"
import { isDocumentStaffRole } from "@/lib/document/agent-access"
import {
    buildRejectionHistory,
    getLatestRejectionFeedback,
} from "@/lib/document/rejection-history"
import { fetchInChunks } from "@/lib/supabase/query-in-chunks"
import { paginateDocumentRows, parseDocumentPageLimit } from "@/lib/document/paginate"
import { Role } from "@/types/enums/role"

type DocumentReviewRow = {
    id: string
    status: string
    feedback: string | null
    created_at: string
    updated_at?: string | null
}

type DocumentListRow = {
    id: string
    profile_id: string
    created_at: string
    document_type:
        | { id: string; name: string }
        | Array<{ id: string; name: string }>
        | null
    document_review: DocumentReviewRow[] | null
    document_files: Array<{ id: string }> | null
    uploaded_by:
        | { first_name: string | null; last_name: string | null }
        | Array<{ first_name: string | null; last_name: string | null }>
        | null
    profile:
        | {
              first_name: string | null
              last_name: string | null
              avatar_url: string | null
              email: string | null
          }
        | Array<{
              first_name: string | null
              last_name: string | null
              avatar_url: string | null
              email: string | null
          }>
        | null
}

type StudentMetaRow = {
    profile_id: string
    student_code: string | null
    country: string | null
}

type ApplicationCampusRow = {
    profile_id: string
    created_at: string
    course: {
        degree?: { location?: string | null; name?: string | null } | null
    } | null
}

const DOCUMENT_SELECT = `
    id,
    profile_id,
    created_at,
    document_type:document_type_id(id, name),
    document_review(id, status, feedback, created_at, updated_at),
    document_files(id),
    uploaded_by:uploaded_by_profile_id(first_name, last_name),
    profile:profile_id(first_name, last_name, avatar_url, email)
`

function getLatestReview(reviews: DocumentReviewRow[] | null | undefined) {
    if (!reviews?.length) return null
    return [...reviews].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0]
}

async function fetchDocuments(
    serviceSupabase: ReturnType<typeof createSupabaseServiceClient>,
    scopedProfileIds: string[] | null
): Promise<{ data: DocumentListRow[]; error: { message?: string } | null }> {
    if (!scopedProfileIds) {
        const result = await serviceSupabase
            .from("document")
            .select(DOCUMENT_SELECT)
            .order("created_at", { ascending: false })

        return {
            data: (result.data ?? []) as DocumentListRow[],
            error: result.error,
        }
    }

    const chunked = await fetchInChunks<DocumentListRow>(scopedProfileIds, async (chunkIds) => {
        const result = await serviceSupabase
            .from("document")
            .select(DOCUMENT_SELECT)
            .in("profile_id", chunkIds)
            .order("created_at", { ascending: false })

        return {
            data: (result.data ?? []) as DocumentListRow[],
            error: result.error,
        }
    })

    return chunked
}

async function resolveScopedProfileIds(
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
    userId: string,
    role: string | null | undefined
): Promise<{ profileIds: string[] | null; error: { message?: string } | null }> {
    if (role === Role.AGENT) {
        const profileIds = await resolveAgentStudentProfileIds(supabase, userId)
        return { profileIds, error: null }
    }

    if (!isUniversityStaffRole(role)) {
        return { profileIds: [], error: null }
    }

    const scope = await resolveUniversityApplicationScope(supabase, userId, role)

    if (scope.universityIds === null) {
        return { profileIds: null, error: null }
    }

    let applicationsQuery = supabase.from("application").select("profile_id")
    applicationsQuery = applyUniversityIdFilter(applicationsQuery, "university_id", scope)

    const { data: applications, error: applicationsError } = await applicationsQuery

    if (applicationsError) {
        return { profileIds: [], error: applicationsError }
    }

    const profileIds = [
        ...new Set(
            (applications ?? [])
                .map((application) => application.profile_id)
                .filter((profileId): profileId is string => Boolean(profileId))
        ),
    ]

    return { profileIds, error: null }
}

export async function GET(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()
        const { searchParams } = new URL(req.url)
        const statusFilter = searchParams.get("status")
        const search = searchParams.get("search")?.toLowerCase()
        const { page, limit } = parseDocumentPageLimit(searchParams)
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

        if (!isDocumentStaffRole(profile?.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { profileIds: scopedProfileIds, error: scopeError } = await resolveScopedProfileIds(
            supabase,
            user.id,
            profile?.role
        )

        if (scopeError) {
            console.error("GET /api/document/all applications error:", scopeError)
            return NextResponse.json(
                { error: "Failed to fetch documents", details: scopeError },
                { status: 500 }
            )
        }

        if (scopedProfileIds && scopedProfileIds.length === 0) {
            return NextResponse.json(
                {
                    data: [],
                    pagination: { total: 0, page: 1, limit, totalPages: 0 },
                },
                { status: 200 }
            )
        }

        const serviceSupabase = createSupabaseServiceClient()
        const { data: documents, error: docsError } = await fetchDocuments(
            serviceSupabase,
            scopedProfileIds
        )

        if (docsError) {
            console.error("GET /api/document/all error:", docsError)
            return NextResponse.json(
                { error: "Failed to fetch documents", details: docsError },
                { status: 500 }
            )
        }

        const profileIds = [
            ...new Set(documents.map((document) => document.profile_id).filter(Boolean)),
        ]

        const [studentsResult, applicationsResult] = await Promise.all([
            profileIds.length > 0
                ? fetchInChunks<StudentMetaRow>(profileIds, async (chunkIds) => {
                      const result = await serviceSupabase
                          .from("student")
                          .select("profile_id, student_code, country")
                          .in("profile_id", chunkIds)

                      return {
                          data: (result.data ?? []) as StudentMetaRow[],
                          error: result.error,
                      }
                  })
                : Promise.resolve({ data: [] as StudentMetaRow[], error: null }),
            profileIds.length > 0
                ? fetchInChunks<ApplicationCampusRow>(profileIds, async (chunkIds) => {
                      const result = await serviceSupabase
                          .from("application")
                          .select(`
                              profile_id,
                              created_at,
                              course:course_id (
                                  degree:degree_id (location, name)
                              )
                          `)
                          .in("profile_id", chunkIds)
                          .order("created_at", { ascending: false })

                      return {
                          data: (result.data ?? []) as ApplicationCampusRow[],
                          error: result.error,
                      }
                  })
                : Promise.resolve({ data: [] as ApplicationCampusRow[], error: null }),
        ])

        if (studentsResult.error) {
            console.error("GET /api/document/all students error:", studentsResult.error)
            return NextResponse.json(
                { error: "Failed to fetch student details", details: studentsResult.error },
                { status: 500 }
            )
        }

        if (applicationsResult.error) {
            console.error("GET /api/document/all applications error:", applicationsResult.error)
        }

        const studentMeta = new Map(
            studentsResult.data.map((student) => [
                student.profile_id,
                {
                    student_code: student.student_code,
                    country: student.country,
                },
            ])
        )

        const campusByProfile = new Map<string, string>()
        for (const application of applicationsResult.data) {
            if (campusByProfile.has(application.profile_id)) continue
            const campus =
                application.course?.degree?.location?.trim() ||
                application.course?.degree?.name?.trim() ||
                null
            if (campus) {
                campusByProfile.set(application.profile_id, campus)
            }
        }

        const rows: AgentAllDocumentRow[] = documents.map((doc) => {
            const documentType = Array.isArray(doc.document_type)
                ? doc.document_type[0]
                : doc.document_type
            const uploadedBy = Array.isArray(doc.uploaded_by)
                ? doc.uploaded_by[0]
                : doc.uploaded_by
            const studentProfile = Array.isArray(doc.profile) ? doc.profile[0] : doc.profile
            const review = getLatestReview(doc.document_review)
            const rejectionHistory = buildRejectionHistory(doc.document_review)
            const student = studentMeta.get(doc.profile_id)

            return {
                document_id: doc.id,
                review_id: review?.id ?? null,
                document_name: documentType?.name ?? "Document",
                status: review?.status ?? "PENDING",
                feedback: getLatestRejectionFeedback(rejectionHistory) ?? review?.feedback ?? null,
                rejection_history: rejectionHistory,
                student_id: doc.profile_id,
                student_name: formatFullName(
                    studentProfile?.first_name,
                    studentProfile?.last_name,
                    "—"
                ),
                avatar_url: studentProfile?.avatar_url ?? null,
                student_code: student?.student_code ?? null,
                student_country: student?.country ?? null,
                campus: campusByProfile.get(doc.profile_id) ?? null,
                uploaded_at: doc.created_at,
                uploaded_by_name: uploadedBy
                    ? formatFullName(uploadedBy.first_name, uploadedBy.last_name, "—")
                    : null,
                file_count: doc.document_files?.length ?? 0,
            }
        })

        rows.sort(
            (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
        )

        let filteredRows = rows

        if (statusFilter && statusFilter.toLowerCase() !== "all") {
            filteredRows = filteredRows.filter((row) => row.status === statusFilter)
        }

        if (search) {
            filteredRows = filteredRows.filter((row) => {
                const studentName = row.student_name.toLowerCase()
                const studentCode = (row.student_code ?? "").toLowerCase()
                return studentName.includes(search) || studentCode.includes(search)
            })
        }

        const paged = paginateDocumentRows(filteredRows, page, limit)

        return NextResponse.json(
            { data: paged.data, pagination: paged.pagination },
            { status: 200 }
        )
    } catch (error) {
        console.error("GET /api/document/all error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
