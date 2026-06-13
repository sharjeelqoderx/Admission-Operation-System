import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET() {
    try {
        const supabase = await createSupabaseServerClient()

        const { data, error } = await supabase
            .from("degree")
            .select(
                "id, name, credits, location, language_of_study, duration, level_id, level:level_id(id, name)"
            )
            .order("name", { ascending: true })

        if (error) {
            console.error("degree fetch error:", error)
            return NextResponse.json({ error: "Failed to fetch degrees" }, { status: 500 })
        }

        return NextResponse.json({ data: data ?? [] }, { status: 200 })
    } catch (error) {
        console.error("Internal error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
