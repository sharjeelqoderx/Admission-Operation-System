import { NextRequest, NextResponse } from "next/server"
import {
    createSupabaseServerClient,
    createSupabaseServiceClient,
} from "@/lib/supabase/server"
import { Role } from "@/types/enums/role"

function canReadDocument(
    role: string | undefined,
    userId: string,
    document: { profile_id: string; uploaded_by_profile_id: string | null }
) {
    if (role === Role.STUDENT) {
        return document.profile_id === userId
    }

    if (role === Role.AGENT || role === Role.ADMIN || role === Role.SUPER_ADMIN) {
        return true
    }

    return (
        document.profile_id === userId || document.uploaded_by_profile_id === userId
    )
}

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ "document-id": string }> }
) {
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
            .maybeSingle()

        const { "document-id": documentId } = await params
        const serviceSupabase = createSupabaseServiceClient()

        const { data: document, error: docError } = await serviceSupabase
            .from("document")
            .select(`
                *,
                document_type:document_type_id(id, name),
                document_review(*),
                document_files(*)
            `)
            .eq("id", documentId)
            .maybeSingle()

        if (docError || !document) {
            console.error(docError)
            return NextResponse.json({ error: "Document not found" }, { status: 404 })
        }

        if (!canReadDocument(profile?.role, user.id, document)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const documentType = Array.isArray(document.document_type)
            ? document.document_type[0]
            : document.document_type

        return NextResponse.json(
            {
                data: {
                    ...document,
                    name: documentType?.name ?? "Document",
                },
            },
            { status: 200 }
        )
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
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { "document-id": documentId } = await params
        await req.json()

        return NextResponse.json({ message: "Note updated" }, { status: 200 })
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
