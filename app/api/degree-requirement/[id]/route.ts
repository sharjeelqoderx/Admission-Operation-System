import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
    canManageDegreeRequirements,
    softDeleteDegreeRequirement,
    updateDegreeRequirement,
} from "@/lib/degree-requirement/server"
import { DegreeRequirementUpdateSchema } from "@/types/schemas/degree-requirement"

type RouteContext = {
    params: Promise<{ id: string }>
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

        if (!canManageDegreeRequirements(profile?.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const json = await req.json()
        const validated = DegreeRequirementUpdateSchema.parse(json)
        const data = await updateDegreeRequirement(id, validated)

        return NextResponse.json({
            data,
            message: "Degree requirement updated successfully",
        })
    } catch (error: unknown) {
        if (error && typeof error === "object" && "name" in error && error.name === "ZodError") {
            return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 })
        }
        const message = error instanceof Error ? error.message : "Internal Server Error"
        return NextResponse.json({ error: message }, { status: 400 })
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

        if (!canManageDegreeRequirements(profile?.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const data = await softDeleteDegreeRequirement(id)

        return NextResponse.json({
            data,
            message: "Degree requirement removed successfully",
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error"
        return NextResponse.json({ error: message }, { status: 400 })
    }
}
