import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export enum ApplicationStatus {
    CONTRACT_SENT = "Contract Sent",
    CREATED = "Created",
    DOCUMENTS_PENDING = "Documents Pending",
    COMPLETED = "Completed",
    SIGNED = "Signed",
    CONDITIONAL_LETTER_ISSUED = "Conditional Letter Issued",
}

export enum DocStatus {
    VERIFIED = "VERIFIED",
    PENDING = "PENDING",
    ACTION_REQUIRED = "ACTION_REQUIRED",
    REJECTED = "REJECTED",
}

const statusStyles: Record<string, string> = {
    [ApplicationStatus.CONTRACT_SENT]: "bg-brand-danger",
    [ApplicationStatus.CREATED]: "bg-brand-sky",
    [ApplicationStatus.DOCUMENTS_PENDING]: "bg-yellow-500",
    [ApplicationStatus.SIGNED]: "bg-brand-success",
    [ApplicationStatus.COMPLETED]: "bg-brand-primary",
    [ApplicationStatus.CONDITIONAL_LETTER_ISSUED]: "bg-violet-600",
    [DocStatus.VERIFIED]: "bg-green-500",
    [DocStatus.PENDING]: "bg-yellow-500",
    [DocStatus.ACTION_REQUIRED]: "bg-orange-500",
    [DocStatus.REJECTED]: "bg-red-500",
}

interface Props {
    status: ApplicationStatus | DocStatus | string
}

export function StatusBadge({ status }: Props) {
    return (
        <Badge
            className={cn(
                "inline-flex items-center justify-center px-4 py-1.5 rounded-full text-[9px] font-extrabold tracking-widest min-w-[100px]",
                statusStyles[status] ?? "bg-gray-400"
            )}
        >
            {status.toString().replace(/_/g, " ").toUpperCase()}
        </Badge>
    )
}