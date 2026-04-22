import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
    const { searchParams, origin } = req.nextUrl
    const code = searchParams.get("code")
    const role = searchParams.get("role") ?? "Student"

    if (!code) {
        return NextResponse.redirect(`${origin}/auth/error?message=Missing+verification+code`)
    }

    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !data.user) {
        return NextResponse.redirect(`${origin}/auth/error?message=Invalid+or+expired+link`)
    }

    // Mark profile as verified
    await supabase
        .from("profiles")
        .update({ is_verified: true })
        .eq("user_id", data.user.id)

    return NextResponse.redirect(`${origin}/profile?uid=${data.user.id}&role=${role}&noSidebar=true`)
}
