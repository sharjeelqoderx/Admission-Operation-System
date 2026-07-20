"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const SPINNER_SIZE = {
    sm: "size-4",
    md: "size-6",
    lg: "size-8",
} as const

type SpinnerSize = keyof typeof SPINNER_SIZE

type SpinnerProps = {
    size?: SpinnerSize
    className?: string
}

/** Shared loading spinner — always brand-byzantine, no text. */
export function Spinner({ size = "lg", className }: SpinnerProps) {
    return (
        <Loader2
            aria-hidden
            className={cn(SPINNER_SIZE[size], "shrink-0 animate-spin text-brand-byzantine", className)}
        />
    )
}

type PageLoaderProps = {
    fullScreen?: boolean
    className?: string
    size?: SpinnerSize
}

export function PageLoader({ fullScreen = false, className, size = "lg" }: PageLoaderProps) {
    return (
        <div
            role="status"
            aria-label="Loading"
            className={cn(
                "flex w-full items-center justify-center animate-in fade-in",
                fullScreen
                    ? "fixed inset-0 z-[9999] bg-white/80 backdrop-blur-md"
                    : "min-h-[200px]",
                className
            )}
        >
            <Spinner size={size} />
        </div>
    )
}
