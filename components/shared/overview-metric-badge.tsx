import { memo } from "react"
import { TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Typography } from "@/components/shared/Typography"
import type { OverviewBadgeTone } from "@/types/schemas/university-overview"

const badgeToneClasses: Record<OverviewBadgeTone, string> = {
    success: "bg-brand-success/15 text-emerald-700",
    stable: "bg-brand-sky/10 text-brand-sky",
    danger: "bg-brand-danger/10 text-brand-danger",
    neutral: "bg-gray-100 text-gray-600",
}

type OverviewMetricBadgeProps = {
    label: string
    tone: OverviewBadgeTone
    className?: string
    showTrendIcon?: boolean
}

export const OverviewMetricBadge = memo(function OverviewMetricBadge({
    label,
    tone,
    className,
    showTrendIcon = false,
}: OverviewMetricBadgeProps) {
    return (
        <Typography
            as="span"
            font="small"
            className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
                badgeToneClasses[tone],
                className
            )}
        >
            {showTrendIcon && tone === "success" ? <TrendingUp className="h-3 w-3" /> : null}
            {label}
        </Typography>
    )
})
