import { memo } from "react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Typography } from "@/components/shared/Typography"
import { OverviewMetricBadge } from "@/components/shared/overview-metric-badge"
import type { UniversityOverview } from "@/types/schemas/university-overview"

type OverviewStatCardsProps = {
    cards: UniversityOverview["summaryCards"]
}

export const OverviewStatCards = memo(function OverviewStatCards({
    cards,
}: OverviewStatCardsProps) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => {
                const isHighlight = card.variant === "highlight"

                return (
                    <Card
                        key={card.key}
                        className={cn(
                            "relative overflow-hidden border-none px-5 py-5 shadow-sm ring-1 ring-black/5",
                            isHighlight
                                ? "bg-gradient-to-br from-brand-byzantine to-[#7B2FD4] text-white"
                                : "bg-white"
                        )}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <Typography
                                as="p"
                                font="small"
                                className={cn(
                                    "tracking-[0.14em] text-[11px] font-semibold uppercase",
                                    isHighlight ? "text-white/85" : "text-gray-500"
                                )}
                            >
                                {card.label}
                            </Typography>
                            {card.badge ? (
                                <OverviewMetricBadge
                                    label={card.badge.label}
                                    tone={card.badge.tone}
                                    showTrendIcon={card.badge.tone === "success" && card.badge.label.startsWith("+")}
                                />
                            ) : card.subtitle && !isHighlight ? (
                                <Typography as="span" font="sub-text" className="text-gray-500">
                                    {card.subtitle}
                                </Typography>
                            ) : null}
                        </div>

                        <Typography
                            as="p"
                            font="text-xl"
                            className={cn(
                                "mt-4 font-bold tracking-tight",
                                isHighlight ? "text-white" : "text-brand-primary"
                            )}
                        >
                            {card.value}
                        </Typography>

                        {card.subtitle && isHighlight ? (
                            <Typography
                                as="p"
                                font="small"
                                className="mt-2 uppercase tracking-[0.12em] text-white/80"
                            >
                                {card.subtitle}
                            </Typography>
                        ) : null}
                    </Card>
                )
            })}
        </div>
    )
})
