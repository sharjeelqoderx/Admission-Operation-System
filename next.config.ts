import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    transpilePackages: ["recharts"],
    experimental: {
        // Student create uploads CV + passport + avatar through proxy-matched /api/student
        proxyClientMaxBodySize: "65mb",
        staleTimes: {
            dynamic: 30,
            static: 180,
        },
    },
    // Performance optimizations
    compress: true,
    poweredByHeader: false,
    reactStrictMode: true,
    // Compiler optimizations
    compiler: {
        removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
    },
    // Image optimization (if using next/image)
    images: {
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 60,
    },
};

export default nextConfig;

