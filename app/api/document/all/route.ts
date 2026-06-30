import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { resolveAgentStudentProfileIds } from "@/lib/api/agent-applications"
import { formatFullName } from "@/lib/utils/profile"
import type { AgentAllDocumentRow } from "@/types/schemas/document"

type DocumentReviewRow = {
    id: string
    status: string
    feedback: string | null
    created_at: string
}

function getLatestReview(reviews: DocumentReviewRow[] | null | undefined) {
    if (!reviews?.length) return null
    return [...reviews].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0]
}

export async function GET() {
    try {
        const supabase = await createSupabaseServerClient()
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
            .single()

        if (profile?.role !== "AGENT") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const studentProfileIds = await resolveAgentStudentProfileIds(supabase, user.id)

        if (!studentProfileIds.length) {
            return NextResponse.json({ data: [] }, { status: 200 })
        }

        const { data: documents, error: docsError } = await supabase
            .from("document")
            .select(`
                id,
                profile_id,
                created_at,
                document_type:document_type_id(id, name),
                document_review(id, status, feedback, created_at),
                document_files(id),
                uploaded_by:uploaded_by_profile_id(first_name, last_name),
                profile:profile_id(first_name, last_name, avatar_url, email)
            `)
            .in("profile_id", studentProfileIds)
            .order("created_at", { ascending: false })

        if (docsError) {
            console.error("GET /api/document/all error:", docsError)
            return NextResponse.json(
                { error: "Failed to fetch documents", details: docsError },
                { status: 500 }
            )
        }

        const { data: students, error: studentsError } = await supabase
            .from("student")
            .select("profile_id, student_code, country")
            .in("profile_id", studentProfileIds)

        if (studentsError) {
            console.error("GET /api/document/all students error:", studentsError)
            return NextResponse.json(
                { error: "Failed to fetch student details", details: studentsError },
                { status: 500 }
            )
        }

        const studentMeta = new Map(
            (students ?? []).map((student) => [
                student.profile_id,
                {
                    student_code: student.student_code,
                    country: student.country,
                },
            ])
        )

        const { data: applications, error: applicationsError } = await supabase
            .from("application")
            .select(`
                profile_id,
                created_at,
                course:course_id (
                    degree:degree_id (location, name)
                )
            `)
            .in("profile_id", studentProfileIds)
            .order("created_at", { ascending: false })

        if (applicationsError) {
            console.error("GET /api/document/all applications error:", applicationsError)
        }

        const campusByProfile = new Map<string, string>()
        for (const application of applications ?? []) {
            if (campusByProfile.has(application.profile_id)) continue
            const degree = (application.course as { degree?: { location?: string | null; name?: string } | null } | null)
                ?.degree
            const campus = degree?.location?.trim() || degree?.name?.trim() || null
            if (campus) {
                campusByProfile.set(application.profile_id, campus)
            }
        }

        const rows: AgentAllDocumentRow[] = (documents ?? []).map((rawDoc) => {
            const doc = rawDoc as {
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

            const documentType = Array.isArray(doc.document_type)
                ? doc.document_type[0]
                : doc.document_type
            const uploadedBy = Array.isArray(doc.uploaded_by)
                ? doc.uploaded_by[0]
                : doc.uploaded_by
            const studentProfile = Array.isArray(doc.profile) ? doc.profile[0] : doc.profile
            const review = getLatestReview(doc.document_review)
            const student = studentMeta.get(doc.profile_id)

            return {
                document_id: doc.id,
                review_id: review?.id ?? null,
                document_name: documentType?.name ?? "Document",
                status: review?.status ?? "PENDING",
                feedback: review?.feedback ?? null,
                student_id: doc.profile_id,
                student_name: formatFullName(
                    studentProfile?.first_name,
                    studentProfile?.last_name,
                    "—"
                ),
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

        return NextResponse.json({ data: rows }, { status: 200 })
    } catch (error) {
        console.error("GET /api/document/all error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
