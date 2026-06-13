import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET() {
    try {
        const supabase = await createSupabaseServerClient()

        const { data, error } = await supabase
            .from("education_type")
            .select("id, name, level, level_id, linked_level:level_id(id, name)")
            .order("level")
            .order("name")

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        return NextResponse.json({ data }, { status: 200 })
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
