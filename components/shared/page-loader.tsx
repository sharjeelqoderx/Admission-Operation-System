"use client"

import { Typography } from "@/components/shared/Typography"

type PageLoaderProps = {
    label?: string
}

export function PageLoader({ label = "Loading..." }: PageLoaderProps) {
    return (
        <div className="min-h-[40vh] w-full flex items-center justify-center">
            <div className="flex items-center gap-3 rounded-md border bg-white/70 px-4 py-3">
                <span className="size-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
                <Typography as="span" className="text-sm text-gray-700">
                    {label}
                </Typography>
            </div>
        </div>
    )
}

