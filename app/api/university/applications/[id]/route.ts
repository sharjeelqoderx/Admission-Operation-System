import { NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ok, err } from "@/lib/api"
import { fetchUniversityApplicationDetail, resolveUniversityScope } from "@/lib/application/university-server"
import { isUniversityStaffRole } from "@/lib/auth/university-role"

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const scope = await resolveUniversityScope(user.id, profile?.role ?? "")
        if (!scope) {
            return err("Forbidden", 403)
        }

        const { id } = await params
        const data = await fetchUniversityApplicationDetail({
            applicationId: id,
            universityScope: scope,
            viewerRole: profile?.role,
            viewerId: user.id,
        })

        if (!data) {
            return err("Application not found", 404)
        }

        return ok(data)
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Internal server error"
        return err(message, 500)
    }
}
