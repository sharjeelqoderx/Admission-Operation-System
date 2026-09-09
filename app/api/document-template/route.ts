import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
    resolveLinkedCourseIds,
    syncDocumentTemplateCourses,
} from "@/lib/document-template/program-assignment"
import { loadMappedDocumentTemplate } from "@/lib/document-template/server"
import { extractTemplateVariables } from "@/lib/document-template/variables"
import { DocumentTemplateFormSchema } from "@/types/schemas/document-template"
import { fetchDocumentTemplatesForPage } from "@/lib/document-template/server"

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

        const data = await fetchDocumentTemplatesForPage()
        return NextResponse.json({ data })
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error"
        return NextResponse.json({ error: message }, { status: 500 })
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
        const courseIds = resolveLinkedCourseIds(validated) ?? []

        if (courseIds.length === 0) {
            return NextResponse.json(
                { error: "Select at least one program for this offer template." },
                { status: 400 }
            )
        }

        const { data, error } = await supabase
            .from("document_template")
            .insert({
                title: validated.title,
                body_html: validated.body_html,
                variables,
                locale: validated.locale,
                template_dates: validated.template_dates ?? {},
                watermark: validated.watermark ?? undefined,
                course_id: courseIds[0] ?? null,
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

        try {
            await syncDocumentTemplateCourses(supabase, data.id, courseIds)
        } catch (syncError) {
            await supabase.from("document_template").delete().eq("id", data.id)
            const message =
                syncError instanceof Error
                    ? syncError.message
                    : "Failed to assign programs to template"
            return NextResponse.json({ error: message }, { status: 400 })
        }

        const mapped = await loadMappedDocumentTemplate(supabase, data.id)

        return NextResponse.json(
            {
                data: mapped,
                message: "Document template created successfully",
            },
            { status: 201 }
        )
    } catch (e: unknown) {
        if (e && typeof e === "object" && "name" in e && e.name === "ZodError") {
            return NextResponse.json({ error: "Validation failed", details: e }, { status: 400 })
        }
        const message = e instanceof Error ? e.message : "Internal Server Error"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
