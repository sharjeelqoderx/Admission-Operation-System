import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
    canManageDegreeRequirements,
    createDegreeRequirement,
    fetchDegreeRequirements,
} from "@/lib/degree-requirement/server"
import { DegreeRequirementCreateSchema } from "@/types/schemas/degree-requirement"

export async function GET(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()
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

        if (!canManageDegreeRequirements(profile?.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const includeDeleted = req.nextUrl.searchParams.get("include_deleted") === "true"
        const data = await fetchDegreeRequirements({ includeDeleted })

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

        const { data: profile } = await supabase
            .from("profile")
            .select("role")
            .eq("id", user.id)
            .maybeSingle()

        if (!canManageDegreeRequirements(profile?.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const json = await req.json()
        const validated = DegreeRequirementCreateSchema.parse(json)
        const data = await createDegreeRequirement(validated)

        return NextResponse.json(
            { data, message: "Degree requirement created successfully" },
            { status: 201 }
        )
    } catch (error: unknown) {
        if (error && typeof error === "object" && "name" in error && error.name === "ZodError") {
            return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 })
        }
        const message = error instanceof Error ? error.message : "Internal Server Error"
        return NextResponse.json({ error: message }, { status: 400 })
    }
}
