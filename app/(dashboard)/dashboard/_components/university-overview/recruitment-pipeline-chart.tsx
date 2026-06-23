import { memo, useMemo } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Typography } from "@/components/shared/Typography"
import type { UniversityOverview } from "@/types/schemas/university-overview"

type RecruitmentPipelineChartProps = {
    stages: UniversityOverview["pipeline"]["stages"]
}

export const RecruitmentPipelineChart = memo(function RecruitmentPipelineChart({
    stages,
}: RecruitmentPipelineChartProps) {
    const maxValue = useMemo(
        () => Math.max(...stages.map((stage) => stage.value), 1),
        [stages]
    )

    return (
        <Card className="border-none bg-white px-5 py-6 shadow-sm ring-1 ring-black/5">
            <div className="mb-8 flex items-center justify-between gap-4">
                <Typography as="h3" font="title" className="font-bold text-brand-primary">
                    Recruitment Pipeline
                </Typography>
                <Link href="/dashboard/application">
                    <Typography
                        as="span"
                        font="small"
                        className="font-semibold uppercase tracking-[0.12em] text-brand-sky hover:text-brand-blue"
                    >
                        View Detail
                    </Typography>
                </Link>
            </div>

            <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-4">
                {stages.map((stage) => {
                    const heightPercent = Math.max((stage.value / maxValue) * 100, 18)

                    return (
                        <div key={stage.key} className="flex flex-col items-center">
                            <Typography
                                as="p"
                                font="text"
                                className="mb-3 font-bold text-brand-primary"
                            >
                                {stage.value.toLocaleString()}
                            </Typography>
                            <div className="flex h-44 w-full items-end justify-center">
                                <div
                                    className={`w-full max-w-[88px] rounded-t-md ${stage.barClassName}`}
                                    style={{ height: `${heightPercent}%` }}
                                />
                            </div>
                            <Typography
                                as="p"
                                font="small"
                                className="mt-4 text-center uppercase tracking-[0.12em] text-gray-500"
                            >
                                {stage.label}
                            </Typography>
                        </div>
                    )
                })}
            </div>
        </Card>
    )
})
