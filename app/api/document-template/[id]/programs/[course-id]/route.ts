import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
    canManageDocumentTemplate,
    loadMappedDocumentTemplate,
} from "@/lib/document-template/server"
import { unlinkCourseFromTemplate } from "@/lib/document-template/program-assignment"

type RouteContext = {
    params: Promise<{ id: string; "course-id": string }>
}

/**
 * Unlinks one program from a template. The template is kept (so it can be linked to
 * other programs later) and the program becomes free for another template.
 */
export async function DELETE(_req: NextRequest, context: RouteContext) {
    try {
        const supabase = await createSupabaseServerClient()
        const { id, "course-id": courseId } = await context.params

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

        await unlinkCourseFromTemplate(supabase, id, courseId)

        const mapped = await loadMappedDocumentTemplate(supabase, id)

        return NextResponse.json({
            data: mapped,
            message: "Program unlinked from template",
        })
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Internal Server Error"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
