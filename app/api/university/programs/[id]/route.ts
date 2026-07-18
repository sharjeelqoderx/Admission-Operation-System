import { NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ok, err } from "@/lib/api"
import {
    fetchUniversityProgramDetail,
    saveUniversityProgramForPage,
    softDeleteUniversityProgram,
} from "@/lib/program/university-server"
import { universityProgramUpsertSchema } from "@/types/schemas/university-program"
import { Role } from "@/types/enums/role"

async function assertUniversityOrAdmin() {
    const supabase = await createSupabaseServerClient()
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) {
        return { error: err("Unauthorized", 401) }
    }

    const { data: profile } = await supabase
        .from("profile")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

    if (profile?.role !== Role.ADMIN && profile?.role !== Role.SUPER_ADMIN) {
        return { error: err("Forbidden", 403) }
    }

    return { user }
}

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await assertUniversityOrAdmin()
        if ("error" in auth && auth.error) return auth.error

        const { id } = await params
        const data = await fetchUniversityProgramDetail(id)

        if (!data) {
            return err("Program not found", 404)
        }

        return ok(data)
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Internal server error"
        return err(message, 500)
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await assertUniversityOrAdmin()
        if ("error" in auth && auth.error) return auth.error

        const { id } = await params
        const body = await req.json()
        const parsed = universityProgramUpsertSchema.safeParse(body)

        if (!parsed.success) {
            return err(parsed.error.issues[0]?.message ?? "Invalid payload", 400)
        }

        const result = await saveUniversityProgramForPage({
            courseId: id,
            payload: parsed.data,
        })

        return ok(result)
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Internal server error"
        return err(message, 500)
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await assertUniversityOrAdmin()
        if ("error" in auth && auth.error) return auth.error

        const { id } = await params
        const result = await softDeleteUniversityProgram(id)

        return ok(result)
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Internal server error"
        return err(message, message === "Program not found" ? 404 : 500)
    }
}
