import { memo } from "react"
import { Card } from "@/components/ui/card"
import { Typography } from "@/components/shared/Typography"
import { OverviewMetricBadge } from "@/components/shared/overview-metric-badge"
import type { UniversityOverview } from "@/types/schemas/university-overview"

type TopAgentPartnersProps = {
    partners: UniversityOverview["agentPartners"]
}

export const TopAgentPartners = memo(function TopAgentPartners({
    partners,
}: TopAgentPartnersProps) {
    return (
        <Card className="h-full border-none bg-white px-5 py-6 shadow-sm ring-1 ring-black/5">
            <Typography as="h3" font="title" className="mb-6 font-bold text-brand-primary">
                Top Agent Partners
            </Typography>

            <div className="space-y-5">
                {partners.map((partner) => (
                    <div
                        key={partner.rank}
                        className="flex items-start justify-between gap-4 border-b border-gray-100 pb-5 last:border-b-0 last:pb-0"
                    >
                        <div className="flex items-start gap-4">
                            <Typography
                                as="span"
                                font="text"
                                className="min-w-8 font-bold text-gray-300"
                            >
                                {partner.rank}
                            </Typography>
                            <div className="space-y-1">
                                <Typography
                                    as="p"
                                    font="text"
                                    className="font-semibold text-brand-primary"
                                >
                                    {partner.name}
                                </Typography>
                                <Typography as="p" font="small" className="text-gray-500">
                                    {partner.region}
                                </Typography>
                            </div>
                        </div>

                        <div className="text-right">
                            <Typography
                                as="p"
                                font="text"
                                className="font-bold text-brand-primary"
                            >
                                {partner.revenue}
                            </Typography>
                            <OverviewMetricBadge
                                label={partner.change.label}
                                tone={partner.change.tone}
                                className="mt-2"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    )
})
