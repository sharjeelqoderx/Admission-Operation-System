"use client"

import { memo } from "react"
import { TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Typography } from "@/components/shared/Typography"
import { OverviewMetricBadge } from "@/components/shared/overview-metric-badge"
import type { UniversityStudentListResponse } from "@/types/schemas/university-student"

type UniversityStudentStatsCardsProps = {
    stats: UniversityStudentListResponse["stats"]
}

export const UniversityStudentStatsCards = memo(function UniversityStudentStatsCards({
    stats,
}: UniversityStudentStatsCardsProps) {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="border-none bg-white px-5 py-5 shadow-sm ring-1 ring-black/5">
                <div className="flex items-start justify-between gap-3">
                    <Typography
                        as="p"
                        font="small"
                        className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500"
                    >
                        Total Students
                    </Typography>
                    <OverviewMetricBadge label="+12%" tone="success" showTrendIcon />
                </div>
                <Typography as="p" font="text-xl" className="mt-4 font-bold text-brand-primary">
                    {stats.total_students.toLocaleString()}
                </Typography>
            </Card>

            <Card className="border-none bg-white px-5 py-5 shadow-sm ring-1 ring-black/5">
                <Typography
                    as="p"
                    font="small"
                    className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500"
                >
                    Applied
                </Typography>
                <Typography as="p" font="text-xl" className="mt-4 font-bold text-brand-primary">
                    {stats.applied.toLocaleString()}
                </Typography>
            </Card>

            <Card className="border-none bg-gradient-to-br from-brand-blue to-brand-sky px-5 py-5 text-white shadow-sm">
                <Typography
                    as="p"
                    font="small"
                    className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/85"
                >
                    Enrolled
                </Typography>
                <Typography as="p" font="text-xl" className="mt-4 font-bold text-white">
                    {stats.enrolled.toLocaleString()}
                </Typography>
            </Card>
        </div>
    )
})
