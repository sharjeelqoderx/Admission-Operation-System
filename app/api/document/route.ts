import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { uploadPublicImage } from "@/lib/supabase/upload-public-image"
import { DocumentFormSchema } from "@/types/schemas/document"

export async function GET(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()

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

        // Fetch all students by this agent
        const { data: students, error: studentsError } = await supabase
            .from("student")
            .select(`
                id,
                profile_id,
                created_at,
                profile:profile_id (id, name, avatar_url)
            `)
            .eq("created_by_agent_id", agentRow.id)
            .order("created_at", { ascending: false })

        if (studentsError) {
            console.error("students error:", studentsError)
            return NextResponse.json({ error: "Failed to fetch students", details: studentsError }, { status: 500 })
        }

        if (!students?.length) {
            return NextResponse.json({ data: [] }, { status: 200 })
        }

        const profileIds = students.map((s: any) => s.profile_id)

        // Fetch documents uploaded by this agent only
        const { data: documents, error: docsError } = await supabase
            .from("document")
            .select("id, profile_id, created_at, document_review(status, created_at)")
            .in("profile_id", profileIds)
            .eq("uploaded_by_profile_id", user.id)

        if (docsError) {
            console.error("documents error:", docsError)
            return NextResponse.json({ error: "Failed to fetch documents", details: docsError }, { status: 500 })
        }

        const result = students
            .map((s: any) => {
                const docs = (documents ?? []).filter((d: any) => d.profile_id === s.profile_id)
                if (!docs.length) return null
                const lastDoc = [...docs].sort((a: any, b: any) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )[0]
                return {
                    student_id: s.profile_id,
                    student_name: s.profile?.name ?? "—",
                    avatar_url: s.profile?.avatar_url ?? null,
                    document_count: docs.length,
                    last_uploaded_at: lastDoc?.created_at ?? null,
                    last_doc_status: lastDoc?.document_review?.[0]?.status ?? null,
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

        const rawFile = formData.get("file")
        const file = rawFile instanceof File ? rawFile : undefined

        const validated = DocumentFormSchema.parse({
            student_id: formData.get("student_id") ?? "",
            name: formData.get("name") ?? "",
            file,
            comment: formData.get("comment") ?? undefined,
        })

        // Upload file to storage
        const { publicUrl } = await uploadPublicImage({
            supabase,
            bucket: "student-admission",
            userId: user.id,
            file: validated.file,
        })

        // Create document record — profile_id = student, uploaded_by = agent
        const { data: document, error: docError } = await supabase
            .from("document")
            .insert({
                profile_id: validated.student_id,
                uploaded_by_profile_id: user.id,
                name: validated.name,
                url: publicUrl,
            })
            .select()
            .single()

        if (docError || !document) {
            return NextResponse.json({ error: "Failed to create document", details: docError }, { status: 400 })
        }

        // Create document_review record with initial null feedback and NEEDS_REVISION status
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
