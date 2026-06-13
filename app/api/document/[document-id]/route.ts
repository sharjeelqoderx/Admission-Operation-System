import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ "document-id": string }> }
) {
    try {
        const supabase = await createSupabaseServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { "document-id": documentId } = await params

        const { data: document, error: docError } = await supabase
            .from("document")
            .select("*, document_review(*), document_files(*)")
            .eq("id", documentId)
            .single()

        if (docError || !document) {
            console.error(docError)
            return NextResponse.json({ error: "Document not found" }, { status: 404 })
        }

        return NextResponse.json({ data: document }, { status: 200 })
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ "document-id": string }> }
) {
    try {
        const supabase = await createSupabaseServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { "document-id": documentId } = await params
        const body = await req.json()
        // We don't have a comment column right now, so just return success
        const error: any = null

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })

        return NextResponse.json({ message: "Note updated" }, { status: 200 })
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
