import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { fetchCourseProgramById } from "@/lib/api/course-program"

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ "student-id": string }> }
) {
    try {
        const supabase = await createSupabaseServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { "student-id": studentId } = await params
        const { searchParams } = new URL(req.url)
        const courseId = searchParams.get("course_id")

        const { data: profile } = await supabase
            .from("profile")
            .select("role")
            .eq("id", user.id)
            .single()

        if (profile?.role === "STUDENT" && user.id !== studentId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        if (profile?.role === "AGENT") {
            const { data: agentRow } = await supabase
                .from("agent")
                .select("id")
                .eq("profile_id", user.id)
                .maybeSingle()

            if (!agentRow) {
                return NextResponse.json({ error: "Agent profile not found" }, { status: 403 })
            }

            const { data: studentRow } = await supabase
                .from("student")
                .select("id")
                .eq("profile_id", studentId)
                .eq("created_by_agent_id", agentRow.id)
                .maybeSingle()

            if (!studentRow) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 })
            }
        }

        let requiredDocTypeIds: string[] | null = null
        if (courseId) {
            const course = await fetchCourseProgramById(supabase, courseId)
            requiredDocTypeIds = (course?.degree?.requirements ?? [])
                .map((requirement) => requirement.document_type?.id)
                .filter((id): id is string => Boolean(id))
        }

        let query = supabase
            .from("document")
            .select("*, document_type:document_type_id(id, name), document_review(*), document_files(*)") 
            .eq("profile_id", studentId)
            .order("created_at", { ascending: false })

        if (requiredDocTypeIds !== null && requiredDocTypeIds.length > 0) {
            query = query.in("document_type_id", requiredDocTypeIds)
        }

        const { data: documents, error: docsError } = await query

        if (docsError) {
            console.error(docsError)
            return NextResponse.json({ error: "Failed to fetch student documents" }, { status: 500 })
        }

        return NextResponse.json({ data: documents, requiredDocTypeIds }, { status: 200 })
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
