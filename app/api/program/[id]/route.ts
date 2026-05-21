import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const supabase = await createSupabaseServerClient()

        const { data, error } = await supabase
            .from("program")
            .select(`
                *,
                campus_program_junction (
                    id,
                    tuition_fee,
                    currency,
                    total_seats,
                    intake_date,
                    study_type,
                    application_deadline,
                    campus:campus_id (
                        name,
                        location,
                        university:profile_id (
                            name,
                            avatar_url
                        )
                    )
                ),
                program_document_requirements (
                    id,
                    document_type:document_type_id ( id, name )
                )
            `)
            .eq("id", id)
            .single()

        if (error) {
            console.error("program fetch error:", error)
            return NextResponse.json({ error: "Failed to fetch program details" }, { status: 500 })
        }

        return NextResponse.json({ data }, { status: 200 })
    } catch (error) {
        console.error("Internal error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
