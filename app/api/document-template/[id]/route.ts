import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
    canManageDocumentTemplate,
    mapTemplateRow,
    softDeleteDocumentTemplate,
} from "@/lib/document-template/server"
import { assertProgramAvailableForTemplate } from "@/lib/document-template/program-assignment"
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
            .select(`
                *,
                program:program_id ( id, name, category, location )
            `)
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

        const { program, ...templateRow } = data
        const programRelation = Array.isArray(program) ? program[0] : program

        return NextResponse.json({ data: mapTemplateRow(templateRow, programRelation ?? null) })
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

        const { data: profile } = await supabase
            .from("profile")
            .select("role")
            .eq("id", user.id)
            .maybeSingle()

        const { data: existing, error: existingError } = await supabase
            .from("document_template")
            .select("id, created_by_profile_id")
            .eq("id", id)
            .eq("is_deleted", false)
            .maybeSingle()

        if (existingError) {
            return NextResponse.json(
                { error: "Failed to fetch document template", details: existingError.message },
                { status: 500 }
            )
        }

        if (!existing) {
            return NextResponse.json({ error: "Document template not found" }, { status: 404 })
        }

        if (
            !canManageDocumentTemplate({
                role: profile?.role,
                userId: user.id,
                createdByProfileId: existing.created_by_profile_id,
            })
        ) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const json = await req.json()
        const validated = DocumentTemplateUpdateSchema.parse(json)

        const updatePayload: {
            title?: string
            body_html?: string
            variables?: string[]
            program_id?: string | null
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

        if (validated.program_id !== undefined) {
            if (validated.program_id) {
                await assertProgramAvailableForTemplate(supabase, validated.program_id, id)
            }
            updatePayload.program_id = validated.program_id
        }

        const { data, error } = await supabase
            .from("document_template")
            .update(updatePayload)
            .eq("id", id)
            .eq("is_deleted", false)
            .select(`
                *,
                program:program_id ( id, name, category, location )
            `)
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

        const { program, ...templateRow } = data
        const programRelation = Array.isArray(program) ? program[0] : program

        return NextResponse.json({
            data: mapTemplateRow(templateRow, programRelation ?? null),
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

        const { data: profile } = await supabase
            .from("profile")
            .select("role")
            .eq("id", user.id)
            .maybeSingle()

        const { data: existing, error: existingError } = await supabase
            .from("document_template")
            .select("id, created_by_profile_id")
            .eq("id", id)
            .eq("is_deleted", false)
            .maybeSingle()

        if (existingError) {
            return NextResponse.json(
                { error: "Failed to fetch document template", details: existingError.message },
                { status: 500 }
            )
        }

        if (!existing) {
            return NextResponse.json(
                { error: "Document template not found or not deletable" },
                { status: 404 }
            )
        }

        if (
            !canManageDocumentTemplate({
                role: profile?.role,
                userId: user.id,
                createdByProfileId: existing.created_by_profile_id,
            })
        ) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const deleteResult = await softDeleteDocumentTemplate(id)

        if (deleteResult.error) {
            const details = deleteResult.error.message

            return NextResponse.json(
                {
                    error: "Failed to delete document template",
                    details,
                    hint:
                        typeof details === "string" &&
                        (details.includes("row-level security policy") ||
                            details.includes("Could not find the function") ||
                            details.includes("does not exist"))
                            ? "Run migration 053_document_template_update_with_check_true.sql in the Supabase SQL editor."
                            : undefined,
                },
                { status: 400 }
            )
        }

        return NextResponse.json({ message: "Document template deleted successfully" })
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
