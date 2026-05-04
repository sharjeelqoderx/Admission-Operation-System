import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export enum ApplicationStatus {
    CONTRACT_SENT = "Contract Sent",
    CREATED = "Created",
    DOCUMENTS_PENDING = "Documents Pending",
    COMPLETED = "Completed",
    SIGNED = "Signed",
}

const statusStyles: Record<ApplicationStatus, string> = {
    [ApplicationStatus.CONTRACT_SENT]: "bg-brand-danger",
    [ApplicationStatus.CREATED]: "bg-brand-sky",
    [ApplicationStatus.DOCUMENTS_PENDING]: "bg-yellow-500",
    [ApplicationStatus.SIGNED]: "bg-brand-success",
    [ApplicationStatus.COMPLETED]: "bg-brand-primary",
}

interface Props {
    status: ApplicationStatus
}

export function StatusBadge({ status }: Props) {
    return (
        <Badge
            className={cn(
                "inline-flex items-center justify-center px-4 py-1.5 rounded-full text-[9px] font-extrabold tracking-widest min-w-[100px]",
                statusStyles[status]
            )}
        >
            {status.toUpperCase()}
        </Badge>
    )
}