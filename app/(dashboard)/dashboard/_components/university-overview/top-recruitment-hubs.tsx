import { memo, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Typography } from "@/components/shared/Typography"
import type { UniversityOverview } from "@/types/schemas/university-overview"

type TopRecruitmentHubsProps = {
    hubs: UniversityOverview["recruitmentHubs"]
}

export const TopRecruitmentHubs = memo(function TopRecruitmentHubs({
    hubs,
}: TopRecruitmentHubsProps) {
    const maxApplications = useMemo(
        () => Math.max(...hubs.map((hub) => hub.applications), 1),
        [hubs]
    )

    return (
        <Card className="h-full border-none bg-white px-5 py-6 shadow-sm ring-1 ring-black/5">
            <Typography as="h3" font="title" className="mb-6 font-bold text-brand-primary">
                Top Recruitment Hubs
            </Typography>

            <div className="space-y-5">
                {hubs.map((hub) => {
                    const progress = (hub.applications / maxApplications) * 100

                    return (
                        <div key={hub.code} className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <Typography
                                        as="span"
                                        font="small"
                                        className="min-w-7 font-bold text-gray-400"
                                    >
                                        {hub.code}
                                    </Typography>
                                    <Typography
                                        as="span"
                                        font="text"
                                        className="font-semibold text-brand-primary"
                                    >
                                        {hub.name}
                                    </Typography>
                                </div>
                                <Typography as="span" font="sub-text" className="text-gray-500">
                                    {hub.applications.toLocaleString()} Apps
                                </Typography>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                                <div
                                    className="h-full rounded-full bg-brand-byzantine"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
        </Card>
    )
})
