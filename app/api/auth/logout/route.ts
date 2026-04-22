import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ok } from "@/lib/api"

export async function POST() {
    const supabase = await createSupabaseServerClient()
    await supabase.auth.signOut()
    return ok({ message: "Logged out" })
}
