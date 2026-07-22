import { NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ok, err } from "@/lib/api"
import { fetchUniversityApplicationList } from "@/lib/application/university-server"
import { universityApplicationTabSchema } from "@/types/schemas/university-application"
import { isUniversityStaffRole } from "@/lib/auth/university-role"
import { Role } from "@/types/enums/role"

export async function GET(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return err("Unauthorized", 401)
        }

        const { data: profile } = await supabase
            .from("profile")
            .select("role")
            .eq("id", user.id)
            .maybeSingle()

        if (!isUniversityStaffRole(profile?.role)) {
            return err("Forbidden", 403)
        }

        const { searchParams } = new URL(req.url)
        const tabParam = searchParams.get("tab") ?? "all"
        const tabParse = universityApplicationTabSchema.safeParse(tabParam)
        const tab = tabParse.success ? tabParse.data : "all"
        const q = searchParams.get("q") ?? undefined
        const page = Number(searchParams.get("page") ?? "1")
        const limit = Number(searchParams.get("limit") ?? "10")

        const data = await fetchUniversityApplicationList({
            universityId: null,
            q,
            tab,
            page: Number.isFinite(page) ? page : 1,
            limit: Number.isFinite(limit) ? limit : 10,
        })

        return ok(data)
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Internal server error"
        return err(message, 500)
    }
}
