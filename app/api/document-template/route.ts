import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { mapTemplateRow } from "@/lib/document-template/server"
import { extractTemplateVariables } from "@/lib/document-template/variables"
import { DocumentTemplateFormSchema } from "@/types/schemas/document-template"

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

        const { data, error } = await supabase
            .from("document_template")
            .select("*")
            .eq("is_deleted", false)
            .order("updated_at", { ascending: false })

        if (error) {
            return NextResponse.json(
                { error: "Failed to fetch document templates", details: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({
            data: (data ?? []).map(mapTemplateRow),
        })
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const json = await req.json()
        const validated = DocumentTemplateFormSchema.parse(json)
        const variables = extractTemplateVariables(validated.body_html)

        const { data, error } = await supabase
            .from("document_template")
            .insert({
                title: validated.title,
                body_html: validated.body_html,
                variables,
                created_by_profile_id: user.id,
            })
            .select("*")
            .single()

        if (error || !data) {
            return NextResponse.json(
                { error: "Failed to create document template", details: error?.message },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { data: mapTemplateRow(data), message: "Document template created successfully" },
            { status: 201 }
        )
    } catch (e: unknown) {
        if (e && typeof e === "object" && "name" in e && e.name === "ZodError") {
            return NextResponse.json({ error: "Validation failed", details: e }, { status: 400 })
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
