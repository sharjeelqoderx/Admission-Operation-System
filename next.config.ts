import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    env: {
        SUPABASE_URL: process.env.SUPABASE_URL!,
        ANON_KEY: process.env.ANON_KEY!,
    },
};

export default nextConfig;
