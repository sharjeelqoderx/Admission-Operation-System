import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    env: {
        SUPABASE_URL: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
        ANON_KEY:
            process.env.ANON_KEY ??
            process.env.SUPABASE_ANON_KEY ??
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    experimental: {
        // Student create uploads CV + passport + avatar through proxy-matched /api/student
        proxyClientMaxBodySize: "65mb",
    },
};

export default nextConfig;
