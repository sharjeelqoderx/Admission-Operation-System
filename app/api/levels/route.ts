import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET() {
    try {
        const supabase = await createSupabaseServerClient()

        const { data, error } = await supabase
            .from("levels")
            .select("id, name, university_id, created_at, updated_at")
            .order("name", { ascending: true })

        if (error) {
            console.error("levels fetch error:", error)
            return NextResponse.json({ error: "Failed to fetch levels" }, { status: 500 })
        }

        return NextResponse.json({ data: data ?? [] }, { status: 200 })
    } catch (error) {
        console.error("Internal error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
