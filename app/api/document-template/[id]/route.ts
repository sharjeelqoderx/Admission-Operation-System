import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
    canManageDocumentTemplate,
    loadMappedDocumentTemplate,
    softDeleteDocumentTemplate,
} from "@/lib/document-template/server"
import {
    resolveLinkedCourseIds,
    syncDocumentTemplateCourses,
} from "@/lib/document-template/program-assignment"
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

        const mapped = await loadMappedDocumentTemplate(supabase, id)

        if (!mapped) {
            return NextResponse.json({ error: "Document template not found" }, { status: 404 })
        }

        return NextResponse.json({ data: mapped })
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

        const linkedCourseIds = resolveLinkedCourseIds(validated)

        if (linkedCourseIds !== undefined) {
            if (linkedCourseIds.length === 0) {
                return NextResponse.json(
                    { error: "Select at least one program for this offer template." },
                    { status: 400 }
                )
            }
            updatePayload.course_id = linkedCourseIds[0] ?? null
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
            .select("id")
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

        if (linkedCourseIds !== undefined) {
            try {
                await syncDocumentTemplateCourses(supabase, id, linkedCourseIds)
            } catch (syncError) {
                const message =
                    syncError instanceof Error
                        ? syncError.message
                        : "Failed to assign programs to template"
                return NextResponse.json({ error: message }, { status: 400 })
            }
        }

        const mapped = await loadMappedDocumentTemplate(supabase, id)

        return NextResponse.json({
            data: mapped,
            message: "Document template updated successfully",
        })
    } catch (e: unknown) {
        if (e && typeof e === "object" && "name" in e && e.name === "ZodError") {
            return NextResponse.json({ error: "Validation failed", details: e }, { status: 400 })
        }
        const message = e instanceof Error ? e.message : "Internal Server Error"
        return NextResponse.json({ error: message }, { status: 500 })
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
                            ? "Run migration 005_document_template_course.sql in the Supabase SQL editor."
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
