import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { uploadPublicImage } from "@/lib/supabase/upload-public-image"
import { DocumentFormSchema } from "@/types/schemas/document"

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

        const { data: agentRow } = await supabase
            .from("agent")
            .select("id")
            .eq("profile_id", user.id)
            .maybeSingle()

        if (!agentRow) {
            return NextResponse.json({ error: "Agent profile not found" }, { status: 400 })
        }

        // Fetch students by this agent
        let studentsQuery = supabase
            .from("student")
            .select(`
                id,
                profile_id,
                created_at,
                profile:profile_id (id, name, avatar_url)
            `)
            .eq("created_by_agent_id", agentRow.id)

        const { data: students, error: studentsError } = await studentsQuery.order("created_at", { ascending: false })

        if (studentsError) {
            console.error("students error:", studentsError)
            return NextResponse.json({ error: "Failed to fetch students", details: studentsError }, { status: 500 })
        }

        if (!students?.length) {
            return NextResponse.json({ data: [] }, { status: 200 })
        }

        const profileIds = students.map((s: any) => s.profile_id)

        // Fetch documents uploaded by this agent
        let docsQuery = supabase
            .from("document")
            .select("id, profile_id, name, created_at, document_review(status, created_at), document_files(file_url, type)")
            .in("profile_id", profileIds)
            .eq("uploaded_by_profile_id", user.id)

        const { data: documents, error: docsError } = await docsQuery

        if (docsError) {
            console.error("documents error:", docsError)
            return NextResponse.json({ error: "Failed to fetch documents", details: docsError }, { status: 500 })
        }

        let result = students
            .map((s: any) => {
                const docs = (documents ?? []).filter((d: any) => d.profile_id === s.profile_id)
                if (!docs.length) return null
                
                // Filter by search name
                if (search && !s.profile?.name?.toLowerCase().includes(search)) return null

                const lastDoc = [...docs].sort((a: any, b: any) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )[0]

                const lastStatus = lastDoc?.document_review?.[0]?.status ?? "PENDING"
                
                // Filter by status
                if (status && lastStatus !== status) return null

                return {
                    student_id: s.profile_id,
                    student_name: s.profile?.name ?? "—",
                    avatar_url: s.profile?.avatar_url ?? null,
                    document_count: docs.length,
                    last_uploaded_at: lastDoc?.created_at ?? null,
                    last_doc_status: lastStatus,
                }
            })
            .filter(Boolean)

        return NextResponse.json({ data: result }, { status: 200 })
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
            name: formData.get("name") ?? "",
            files: files,
            comment: formData.get("comment") ?? undefined,
        })

        // Create document record — profile_id = student, uploaded_by = agent
        const { data: document, error: docError } = await supabase
            .from("document")
            .insert({
                profile_id: validated.student_id,
                uploaded_by_profile_id: user.id,
                name: validated.name,
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
