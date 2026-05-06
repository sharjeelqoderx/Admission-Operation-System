import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ "student-id": string }> }
) {
    try {
        const supabase = await createSupabaseServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { "student-id": studentId } = await params

        const { data: documents, error: docsError } = await supabase
            .from("document")
            .select("*, document_review(*), document_files(*)")
            .eq("profile_id", studentId)
            .order("created_at", { ascending: false })

        if (docsError) {
            console.error(docsError)
            return NextResponse.json({ error: "Failed to fetch student documents" }, { status: 500 })
        }

        return NextResponse.json({ data: documents }, { status: 200 })
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
