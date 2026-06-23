"use client"

import { memo } from "react"
import { Typography } from "@/components/shared/Typography"
import { OverviewStatCards } from "./overview-stat-cards"
import { RecruitmentPipelineChart } from "./recruitment-pipeline-chart"
import { TopRecruitmentHubs } from "./top-recruitment-hubs"
import { TopAgentPartners } from "./top-agent-partners"
import { withUniversityOverviewLogic } from "./withUniversityOverviewLogic"
import type { UniversityOverview } from "@/types/schemas/university-overview"

type UniversityOverviewViewProps = {
    overview: UniversityOverview
}

const UniversityOverviewView = memo(function UniversityOverviewView({
    overview,
}: UniversityOverviewViewProps) {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="max-w-4xl space-y-2">
                <Typography as="h2" font="sub-heading" className="font-bold tracking-tight text-brand-primary">
                    {overview.title}
                </Typography>
                <Typography as="p" font="sub-text" className="max-w-3xl leading-relaxed text-gray-500">
                    {overview.subtitle}
                </Typography>
            </div>

            <OverviewStatCards cards={overview.summaryCards} />

            <RecruitmentPipelineChart stages={overview.pipeline.stages} />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <TopRecruitmentHubs hubs={overview.recruitmentHubs} />
                <TopAgentPartners partners={overview.agentPartners} />
            </div>
        </div>
    )
})

const UniversityOverviewContent = withUniversityOverviewLogic(UniversityOverviewView)

type PageContentProps = {
    initialOverview: UniversityOverview
}

export function UniversityOverviewPageContent({ initialOverview }: PageContentProps) {
    return <UniversityOverviewContent initialOverview={initialOverview} />
}
