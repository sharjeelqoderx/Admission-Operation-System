import { memo } from "react"
import { cn } from "@/lib/utils"
import { Typography } from "@/components/shared/Typography"
import type { AgentKycStatus } from "@/types/schemas/university-agent"

const kycStyles: Record<AgentKycStatus, string> = {
    Pending: "bg-brand-sky text-white",
    "Under Review": "bg-emerald-400 text-white",
    Resubmission: "bg-brand-blue text-white",
    Approved: "bg-brand-primary text-white",
    Rejected: "bg-brand-danger text-white",
    Suspended: "bg-brand-byzantine text-white",
}

type AgentKycBadgeProps = {
    status: AgentKycStatus | string
    className?: string
}

export const AgentKycBadge = memo(function AgentKycBadge({
    status,
    className,
}: AgentKycBadgeProps) {
    const normalized = status as AgentKycStatus

    return (
        <Typography
            as="span"
            font="small"
            className={cn(
                "inline-flex min-w-[120px] items-center justify-center rounded-full px-4 py-1.5 text-[9px] font-extrabold uppercase tracking-widest",
                kycStyles[normalized] ?? "bg-gray-400 text-white",
                className
            )}
        >
            {String(status)}
        </Typography>
    )
})
