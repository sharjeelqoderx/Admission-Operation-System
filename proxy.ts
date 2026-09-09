import { NextRequest, NextResponse } from "next/server"

/**
 * Edge proxy is intentionally a passthrough.
 * Session validation and route redirects live client-side in AuthProvider / useAuth.
 */
export async function proxy(_req: NextRequest) {
    return NextResponse.next()
}

export const config = {
    matcher: [],
}
