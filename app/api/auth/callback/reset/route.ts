import { createSupabaseServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (code) {
        const supabase = await createSupabaseServerClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            const { data: { user } } = await supabase.auth.getUser()
            const email = user?.email || ""

            // Redirect to the reset-password page with email as param
            return NextResponse.redirect(`${requestUrl.origin}/reset-password?email=${email}`)
        }
    }

    // If there is no code or an error occurred
    return NextResponse.redirect(`${requestUrl.origin}/login?error=Invalid or expired reset link`)
}
