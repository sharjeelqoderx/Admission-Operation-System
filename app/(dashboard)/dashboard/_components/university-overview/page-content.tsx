"use client"

import dynamic from "next/dynamic"
import { memo } from "react"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { withUniversityOverviewLogic } from "./withUniversityOverviewLogic"
import type { UniversityOverview } from "@/types/schemas/university-overview"

const OverviewCharts = dynamic(
    () => import("./overview-charts").then((mod) => mod.OverviewCharts),
    {
        ssr: false,
        loading: () => (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                    <div
                        key={index}
                        className="h-[220px] animate-pulse rounded-xl bg-muted/40"
                    />
                ))}
            </div>
        ),
    }
)

type UniversityOverviewViewProps = {
    overview: UniversityOverview
}

const UniversityOverviewView = memo(function UniversityOverviewView({
    overview,
}: UniversityOverviewViewProps) {
    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                blendColorClass="bg-white/10"
                className="rounded-xl"
                childClass="space-y-2 p-5 md:p-6"
            >
                <Typography as="h2" font="sub-heading" className="font-bold tracking-tight text-brand-primary">
                    {overview.title}
                </Typography>
                <Typography as="p" font="sub-text" className="max-w-3xl leading-relaxed text-gray-500">
                    {overview.subtitle}
                </Typography>
            </BluryCard>

            <OverviewCharts charts={overview.charts} />
        </div>
    )
})

const UniversityOverviewContent = withUniversityOverviewLogic(UniversityOverviewView)

type PageContentProps = {
    initialOverview?: UniversityOverview
}

export function UniversityOverviewPageContent({ initialOverview }: PageContentProps) {
    return <UniversityOverviewContent initialOverview={initialOverview} />
}
