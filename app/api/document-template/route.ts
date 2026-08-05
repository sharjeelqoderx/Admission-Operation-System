import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { assertProgramAvailableForTemplate } from "@/lib/document-template/program-assignment"
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
            .select(`
                *,
                program:program_id ( id, name, category, location )
            `)
            .eq("is_deleted", false)
            .order("updated_at", { ascending: false })

        if (error) {
            return NextResponse.json(
                { error: "Failed to fetch document templates", details: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({
            data: (data ?? []).map((row) => {
                const { program, ...templateRow } = row
                const programRelation = Array.isArray(program) ? program[0] : program
                return mapTemplateRow(templateRow, programRelation ?? null)
            }),
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

        if (validated.program_id) {
            await assertProgramAvailableForTemplate(supabase, validated.program_id)
        }

        const { data, error } = await supabase
            .from("document_template")
            .insert({
                title: validated.title,
                body_html: validated.body_html,
                variables,
                program_id: validated.program_id ?? null,
                created_by_profile_id: user.id,
            })
            .select(`
                *,
                program:program_id ( id, name, category, location )
            `)
            .single()

        if (error || !data) {
            return NextResponse.json(
                { error: "Failed to create document template", details: error?.message },
                { status: 400 }
            )
        }

        const { program, ...templateRow } = data
        const programRelation = Array.isArray(program) ? program[0] : program

        return NextResponse.json(
            {
                data: mapTemplateRow(templateRow, programRelation ?? null),
                message: "Document template created successfully",
            },
            { status: 201 }
        )
    } catch (e: unknown) {
        if (e && typeof e === "object" && "name" in e && e.name === "ZodError") {
            return NextResponse.json({ error: "Validation failed", details: e }, { status: 400 })
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
