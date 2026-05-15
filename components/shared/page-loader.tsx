"use client"

import { Typography } from "@/components/shared/Typography"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

type PageLoaderProps = {
    label?: string
    fullScreen?: boolean
    className?: string
}

export function PageLoader({
    label = "Loading...",
    fullScreen = false,
    className
}: PageLoaderProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center gap-4 transition-all duration-300 animate-in fade-in",
            fullScreen ? "fixed inset-0 z-[9999] bg-white/80 backdrop-blur-md" : "min-h-[200px] w-full",
            className
        )}>
            <div className="relative">
                <Loader2 className="size-8 text-brand-byzantine animate-spin" />
                <div className="absolute inset-0 size-8 bg-brand-byzantine/20 blur-xl rounded-full -z-10 animate-pulse" />
            </div>

            {label && (
                <Typography
                    as="span"
                    font="small"
                    className="text-gray-500 tracking-widest uppercase animate-pulse"
                >
                    {label}
                </Typography>
            )}

        </div>
    )
}
