"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { BluryCard } from "@/components/shared/blury-card"
import { ErrorView } from "@/components/shared/error-view"
import { Button } from "@/components/ui/button"

type Props = {
    message: string
    onRetry: () => void
}

export function DocumentTemplateDetailError({ message, onRetry }: Props) {
    return (
        <main className="relative space-y-6">
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                blendColorClass="bg-white/10"
                childClass="space-y-6"
            >
                <Button type="button" variant="outline" className="gap-2" asChild>
                    <Link href="/dashboard/templates">
                        <ArrowLeft className="size-4" />
                        Back to list
                    </Link>
                </Button>
                <ErrorView message={message} />
                <Button type="button" variant="outline" onClick={onRetry}>
                    Retry
                </Button>
            </BluryCard>
        </main>
    )
}
