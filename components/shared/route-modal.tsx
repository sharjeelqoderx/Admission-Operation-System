"use client"

import { useRouter } from "next/navigation"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

type RouteModalProps = {
    title: string
    description?: string
    children: React.ReactNode
    className?: string
}

export function RouteModal({
    title,
    description,
    children,
    className,
}: RouteModalProps) {
    const router = useRouter()

    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open) router.back()
            }}
        >
            <DialogContent
                className={className ?? "sm:max-w-6xl max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0"}
                showCloseButton
            >
                <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                    <DialogTitle className="text-lg font-bold text-gray-900">
                        {title}
                    </DialogTitle>
                    {description ? (
                        <DialogDescription>{description}</DialogDescription>
                    ) : null}
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                    {children}
                </div>
            </DialogContent>
        </Dialog>
    )
}
