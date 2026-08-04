"use client"

import { memo } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

type Props = {
    open: boolean
    title: string
    description: string
    onOpenChange: (open: boolean) => void
}

export const QualificationUpgradeDialog = memo(function QualificationUpgradeDialog({
    open,
    title,
    description,
    onOpenChange,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button type="button" onClick={() => onOpenChange(false)}>
                        Got it
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
})
