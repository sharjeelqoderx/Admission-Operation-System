"use client"

import { memo } from "react"
import { TrendingUp } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Typography } from "@/components/shared/Typography"
import { OverviewMetricBadge } from "@/components/shared/overview-metric-badge"
import type { UniversityAgentListResponse } from "@/types/schemas/university-agent"

type UniversityAgentStatsCardsProps = {
    stats: UniversityAgentListResponse["stats"]
}

export const UniversityAgentStatsCards = memo(function UniversityAgentStatsCards({
    stats,
}: UniversityAgentStatsCardsProps) {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 max-w-3xl">
            <Card className="border-none bg-white px-5 py-5 shadow-sm ring-1 ring-black/5">
                <div className="flex items-start justify-between gap-3">
                    <Typography
                        as="p"
                        font="small"
                        className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500"
                    >
                        Total University Partners
                    </Typography>
                    <OverviewMetricBadge label="+12%" tone="success" showTrendIcon />
                </div>
                <Typography as="p" font="text-xl" className="mt-4 font-bold text-brand-primary">
                    {stats.total_agents.toLocaleString()}
                </Typography>
            </Card>

            <Card className="border-none bg-white px-5 py-5 shadow-sm ring-1 ring-black/5">
                <div className="flex items-start justify-between gap-3">
                    <Typography
                        as="p"
                        font="small"
                        className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500"
                    >
                        Verified
                    </Typography>
                    <OverviewMetricBadge label="Stable" tone="stable" />
                </div>
                <Typography as="p" font="text-xl" className="mt-4 font-bold text-brand-primary">
                    {stats.verified.toLocaleString()}
                </Typography>
            </Card>
        </div>
    )
})
