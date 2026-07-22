import { memo } from "react"
import { cn } from "@/lib/utils"
import { Typography } from "@/components/shared/Typography"
import type { StudentPipelineStatus } from "@/types/schemas/university-student"

const pipelineStyles: Record<StudentPipelineStatus, string> = {
    Created: "bg-brand-sky text-white",
    "Contract Sent": "bg-brand-danger text-white",
    Signed: "bg-brand-success text-white",
    Completed: "bg-brand-primary text-white",
    Rejected: "bg-red-500 text-white",
}

type StudentPipelineBadgeProps = {
    status: StudentPipelineStatus | string
    className?: string
}

export const StudentPipelineBadge = memo(function StudentPipelineBadge({
    status,
    className,
}: StudentPipelineBadgeProps) {
    const normalized = status as StudentPipelineStatus

    return (
        <Typography
            as="span"
            font="small"
            className={cn(
                "inline-flex min-w-[110px] items-center justify-center rounded-full px-4 py-1.5 text-[9px] font-extrabold uppercase tracking-widest",
                pipelineStyles[normalized] ?? "bg-gray-400 text-white",
                className
            )}
        >
            {String(status).replace(/_/g, " ")}
        </Typography>
    )
})
