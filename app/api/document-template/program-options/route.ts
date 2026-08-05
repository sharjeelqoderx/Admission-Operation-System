import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { fetchDocumentTemplateProgramOptions } from "@/lib/document-template/program-assignment"

export async function GET(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const excludeTemplateId = req.nextUrl.searchParams.get("exclude_template_id")

        const data = await fetchDocumentTemplateProgramOptions(
            supabase,
            excludeTemplateId
        )

        return NextResponse.json({ data })
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
