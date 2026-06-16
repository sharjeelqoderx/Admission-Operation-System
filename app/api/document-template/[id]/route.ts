import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { mapTemplateRow } from "@/lib/document-template/server"
import { extractTemplateVariables } from "@/lib/document-template/variables"
import { DocumentTemplateUpdateSchema } from "@/types/schemas/document-template"

type RouteContext = {
    params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, context: RouteContext) {
    try {
        const supabase = await createSupabaseServerClient()
        const { id } = await context.params

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
            .eq("id", id)
            .eq("is_deleted", false)
            .maybeSingle()

        if (error) {
            return NextResponse.json(
                { error: "Failed to fetch document template", details: error.message },
                { status: 500 }
            )
        }

        if (!data) {
            return NextResponse.json({ error: "Document template not found" }, { status: 404 })
        }

        return NextResponse.json({ data: mapTemplateRow(data) })
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
    try {
        const supabase = await createSupabaseServerClient()
        const { id } = await context.params

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const json = await req.json()
        const validated = DocumentTemplateUpdateSchema.parse(json)

        const updatePayload: {
            title?: string
            body_html?: string
            variables?: string[]
            updated_at: string
        } = {
            updated_at: new Date().toISOString(),
        }

        if (validated.title !== undefined) {
            updatePayload.title = validated.title
        }

        if (validated.body_html !== undefined) {
            updatePayload.body_html = validated.body_html
            updatePayload.variables = extractTemplateVariables(validated.body_html)
        }

        const { data, error } = await supabase
            .from("document_template")
            .update(updatePayload)
            .eq("id", id)
            .eq("created_by_profile_id", user.id)
            .eq("is_deleted", false)
            .select("*")
            .maybeSingle()

        if (error) {
            return NextResponse.json(
                { error: "Failed to update document template", details: error.message },
                { status: 400 }
            )
        }

        if (!data) {
            return NextResponse.json(
                { error: "Document template not found or not editable" },
                { status: 404 }
            )
        }

        return NextResponse.json({
            data: mapTemplateRow(data),
            message: "Document template updated successfully",
        })
    } catch (e: unknown) {
        if (e && typeof e === "object" && "name" in e && e.name === "ZodError") {
            return NextResponse.json({ error: "Validation failed", details: e }, { status: 400 })
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
    try {
        const supabase = await createSupabaseServerClient()
        const { id } = await context.params

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data, error } = await supabase
            .from("document_template")
            .update({
                is_deleted: true,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .eq("created_by_profile_id", user.id)
            .eq("is_deleted", false)
            .select("id")
            .maybeSingle()

        if (error) {
            return NextResponse.json(
                { error: "Failed to delete document template", details: error.message },
                { status: 400 }
            )
        }

        if (!data) {
            return NextResponse.json(
                { error: "Document template not found or not deletable" },
                { status: 404 }
            )
        }

        return NextResponse.json({ message: "Document template deleted successfully" })
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
