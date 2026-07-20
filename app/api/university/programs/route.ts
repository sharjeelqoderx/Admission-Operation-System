import { NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ok, err } from "@/lib/api"
import {
    fetchUniversityProgramList,
    saveUniversityProgramForPage,
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

    return { user, role: profile.role }
}

export async function GET(req: NextRequest) {
    try {
        const auth = await assertUniversityOrAdmin()
        if ("error" in auth && auth.error) return auth.error

        const { searchParams } = new URL(req.url)
        const q = searchParams.get("q") ?? undefined
        const page = Number(searchParams.get("page") ?? "1")
        const limit = Number(searchParams.get("limit") ?? "10")

        const data = await fetchUniversityProgramList({
            q,
            page: Number.isFinite(page) ? page : 1,
            limit: Number.isFinite(limit) ? limit : 10,
        })

        return ok(data)
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Internal server error"
        return err(message, 500)
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await assertUniversityOrAdmin()
        if ("error" in auth && auth.error) return auth.error

        const body = await req.json()
        const parsed = universityProgramUpsertSchema.safeParse(body)

        if (!parsed.success) {
            return err(parsed.error.issues[0]?.message ?? "Invalid payload", 400)
        }

        const result = await saveUniversityProgramForPage({
            payload: parsed.data,
        })

        return ok(result, 201)
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Internal server error"
        return err(message, 500)
    }
}
