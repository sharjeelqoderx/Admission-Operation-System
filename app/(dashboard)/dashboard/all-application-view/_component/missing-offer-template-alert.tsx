"use client"

import { memo } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import { Typography } from "@/components/shared/Typography"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

type MissingOfferTemplateAlertProps = {
    open: boolean
    title: string
    description: string
    allowCreateWithoutTemplate: boolean
    isCreatingWithoutTemplate: boolean
    onOpenChange: (open: boolean) => void
    onCreateWithoutTemplate: () => void
}

export const MissingOfferTemplateAlert = memo(function MissingOfferTemplateAlert({
    open,
    title,
    description,
    allowCreateWithoutTemplate,
    isCreatingWithoutTemplate,
    onOpenChange,
    onCreateWithoutTemplate,
}: MissingOfferTemplateAlertProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-50">
                            <AlertTriangle className="size-5 text-amber-600" />
                        </div>
                        <div className="space-y-1">
                            <DialogTitle>{title}</DialogTitle>
                            <DialogDescription>{description}</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {allowCreateWithoutTemplate ? (
                    <Typography as="p" className="text-xs text-muted-foreground">
                        You can assign a template later from{" "}
                        <Typography as="span" className="text-xs font-semibold text-gray-700">
                            Dashboard → Templates
                        </Typography>
                        , or create the offer now without a template.
                    </Typography>
                ) : null}

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isCreatingWithoutTemplate}
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                    {allowCreateWithoutTemplate ? (
                        <Button
                            type="button"
                            className="bg-brand-byzantine hover:bg-brand-byzantine/90"
                            disabled={isCreatingWithoutTemplate}
                            onClick={onCreateWithoutTemplate}
                        >
                            {isCreatingWithoutTemplate ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create offer without template"
                            )}
                        </Button>
                    ) : null}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
})
