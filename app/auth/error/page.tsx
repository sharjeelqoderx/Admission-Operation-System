"use client"

import { Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"

function ErrorContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const message = searchParams.get("message") ?? "Something went wrong"

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <BluryCard isCentered blurAmount="backdrop-blur-2xl" className="w-full max-w-[480px] rounded-2xl border border-white/20 shadow-2xl">
                <div className="flex flex-col items-center text-center space-y-6 py-4">
                    <div className="size-20 rounded-full bg-destructive/10 flex items-center justify-center">
                        <XCircle className="size-10 text-destructive" />
                    </div>
                    <div className="space-y-2">
                        <Typography as="h2" font="sub-heading" className="font-bold">Verification Failed</Typography>
                        <Typography as="p" font="text" className="text-muted-foreground">{decodeURIComponent(message)}</Typography>
                    </div>
                    <Button className="w-full" onClick={() => router.push("/signup")}>Try Again</Button>
                </div>
            </BluryCard>
        </div>
    )
}

export default function AuthErrorPage() {
    return <Suspense><ErrorContent /></Suspense>
}
