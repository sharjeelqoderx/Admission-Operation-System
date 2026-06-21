import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function getDashboardRole(): Promise<string | null> {
    const supabase = await createSupabaseServerClient()
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) {
        return null
    }

    const { data: profile } = await supabase
        .from("profile")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

    return profile?.role ?? "STUDENT"
}
