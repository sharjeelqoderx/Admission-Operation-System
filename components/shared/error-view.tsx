"use client"

import { AlertTriangle } from "lucide-react"

type ErrorViewProps = {
    message?: string
}

export function ErrorView({
    message = "Something went wrong",
}: ErrorViewProps) {
    if (!message) return null

    return (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-600 rounded-md px-3 py-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="leading-relaxed">{message}</p>
        </div>
    )
}