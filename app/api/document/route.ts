import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { uploadPublicImage } from "@/lib/supabase/upload-public-image"
import { DocumentFormSchema } from "@/types/schemas/document"
import { formatFullName } from "@/lib/utils/profile"
import { assertCanUploadStudentDocument } from "@/lib/document/agent-access"

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
 
        if (profile?.role === "STUDENT") {
            const { data: studentProfile } = await supabase
                .from("profile")
                .select("id, first_name, last_name, avatar_url")
                .eq("id", user.id)
                .single()

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
                            avatar_url: studentProfile?.avatar_url ?? null,
                            document_count: docs.length,
                            last_uploaded_at: lastDoc?.created_at ?? null,
                            last_doc_status: lastDoc?.document_review?.[0]?.status ?? null,
                        },
                    ],
                    role: "STUDENT",
                },
                { status: 200 }
            )
        }
 
        // Agent logic (Existing)
        const { data: agentRow } = await supabase
            .from("agent")
            .select("id")
            .eq("profile_id", user.id)
            .maybeSingle()
 
        if (!agentRow) {
            return NextResponse.json({ error: "University Partner profile not found" }, { status: 400 })
        }
 
        // Fetch students by this agent
        let studentsQuery = supabase
            .from("student")
            .select(`
                id,
                profile_id,
                created_at,
                profile:profile_id (id, first_name, last_name, avatar_url)
            `)
            .eq("created_by_agent_id", agentRow.id)
 
        const { data: students, error: studentsError } = await studentsQuery.order("created_at", { ascending: false })
 
        if (studentsError) {
            console.error("students error:", studentsError)
            return NextResponse.json({ error: "Failed to fetch students", details: studentsError }, { status: 500 })
        }
 
        if (!Array.isArray(students) || !students.length) {
            return NextResponse.json({ data: [], role: "AGENT" }, { status: 200 })
        }
 
        const profileIds = students.map((s: any) => s.profile_id)
 
        // Fetch documents uploaded by this agent
        let docsQuery = supabase
            .from("document")
            .select("id, profile_id, document_type_id, document_type:document_type_id(name), created_at, document_review(status, created_at), document_files(file_url, type)")
            .in("profile_id", profileIds);
 
        const { data: documents, error: docsError } = await docsQuery
 
        if (docsError) {
            console.error("documents error:", docsError)
            return NextResponse.json({ error: "Failed to fetch documents", details: docsError }, { status: 500 })
        }
 
        let result = students
            .map((s: any) => {
                const docs = (documents ?? []).filter((d: any) => d.profile_id === s.profile_id)

                const profileName = formatFullName(s.profile?.first_name, s.profile?.last_name).toLowerCase()
                if (search && !profileName.includes(search)) return null

                const lastDoc = docs.length
                    ? [...docs].sort(
                          (a: any, b: any) =>
                              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                      )[0]
                    : null

                const lastStatus = lastDoc?.document_review?.[0]?.status ?? null

                if (status && status !== "ALL" && lastStatus !== status) return null

                return {
                    student_id: s.profile_id,
                    student_name: formatFullName(s.profile?.first_name, s.profile?.last_name, "—"),
                    avatar_url: s.profile?.avatar_url ?? null,
                    document_count: docs.length,
                    last_uploaded_at: lastDoc?.created_at ?? null,
                    last_doc_status: lastStatus,
                }
            })
            .filter(Boolean)
 
        return NextResponse.json({ data: result, role: "AGENT" }, { status: 200 })
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const formData = await req.formData()

        const rawFiles = formData.getAll("files")
        const files = rawFiles.filter(f => f instanceof File) as File[]

        const validated = DocumentFormSchema.parse({
            student_id: formData.get("student_id") ?? "",
            document_type_id: formData.get("document_type_id") ?? "",
            files: files,
            comment: formData.get("comment") ?? undefined,
        })

        const { data: profile } = await supabase
            .from("profile")
            .select("role")
            .eq("id", user.id)
            .single()

        const canUpload = await assertCanUploadStudentDocument(
            supabase,
            user.id,
            profile?.role,
            validated.student_id
        )

        if (!canUpload) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        await supabase
            .from("document")
            .delete()
            .eq("profile_id", validated.student_id)
            .eq("document_type_id", validated.document_type_id)

        // Create document record — profile_id = student, uploaded_by = agent
        const { data: document, error: docError } = await supabase
            .from("document")
            .insert({
                profile_id: validated.student_id,
                uploaded_by_profile_id: user.id,
                document_type_id: validated.document_type_id,
            })
            .select()
            .single()

        if (docError || !document) {
            return NextResponse.json({ error: "Failed to create document", details: docError }, { status: 400 })
        }

        // Upload files and create document_files records
        const filesToInsert = []
        for (let i = 0; i < validated.files.length; i++) {
            const file = validated.files[i]
            const type = i === 0 ? "FRONT" : "BACK"

            const { publicUrl } = await uploadPublicImage({
                supabase,
                bucket: "student-admission",
                userId: user.id,
                file: file,
            })

            filesToInsert.push({
                document_id: document.id,
                file_url: publicUrl,
                type: type,
            })
        }

        const { error: filesError } = await supabase
            .from("document_files")
            .insert(filesToInsert)

        if (filesError) {
            return NextResponse.json({ error: "Failed to save document files", details: filesError }, { status: 400 })
        }

        // Create document_review record with initial null feedback and PENDING status
        const { error: reviewError } = await supabase
            .from("document_review")
            .insert({
                document_id: document.id,
                reviewed_by_profile_id: null,
                status: "PENDING",
                feedback: null,
            })

        if (reviewError) {
            return NextResponse.json({ error: "Failed to create document review", details: reviewError }, { status: 400 })
        }

        return NextResponse.json({ data: document, message: "Document uploaded successfully" }, { status: 201 })
    } catch (e: any) {
        if (e?.name === "ZodError") {
            return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 })
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
