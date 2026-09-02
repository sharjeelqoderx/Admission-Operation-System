import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
    canManageDocumentTemplate,
    mapTemplateRow,
    softDeleteDocumentTemplate,
} from "@/lib/document-template/server"
import { assertCourseAvailableForTemplate } from "@/lib/document-template/program-assignment"
import { extractTemplateVariables } from "@/lib/document-template/variables"
import { DocumentTemplateUpdateSchema } from "@/types/schemas/document-template"

type RouteContext = {
    params: Promise<{ id: string }>
}

function resolveLinkedCourseId(input: {
    course_id?: string | null
    program_id?: string | null
}) {
    return input.course_id ?? input.program_id ?? null
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
                course:course_id ( id, name, category, location )
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

        const { course, ...templateRow } = data
        const courseRelation = Array.isArray(course) ? course[0] : course

        return NextResponse.json({ data: mapTemplateRow(templateRow, courseRelation ?? null) })
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
            course_id?: string | null
            locale?: string
            template_dates?: Record<string, string | null>
            watermark?: Record<string, unknown>
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

        const linkedCourseId =
            validated.course_id !== undefined || validated.program_id !== undefined
                ? resolveLinkedCourseId(validated)
                : undefined

        if (linkedCourseId !== undefined) {
            if (linkedCourseId) {
                await assertCourseAvailableForTemplate(supabase, linkedCourseId, id)
            }
            updatePayload.course_id = linkedCourseId
        }

        if (validated.locale !== undefined) {
            updatePayload.locale = validated.locale
        }

        if (validated.template_dates !== undefined) {
            updatePayload.template_dates = validated.template_dates
        }

        if (validated.watermark !== undefined) {
            updatePayload.watermark = validated.watermark
        }

        const { data, error } = await supabase
            .from("document_template")
            .update(updatePayload)
            .eq("id", id)
            .eq("is_deleted", false)
            .select(`
                *,
                course:course_id ( id, name, category, location )
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

        const { course, ...templateRow } = data
        const courseRelation = Array.isArray(course) ? course[0] : course

        return NextResponse.json({
            data: mapTemplateRow(templateRow, courseRelation ?? null),
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
