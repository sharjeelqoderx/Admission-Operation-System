import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        // Student create uploads CV + passport + avatar through proxy-matched /api/student
        proxyClientMaxBodySize: "65mb",
    },
};

export default nextConfig;
