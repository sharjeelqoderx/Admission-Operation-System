"use client"

import { memo, useMemo } from "react"
import { CheckCircle2, Circle, FileText } from "lucide-react"
import { PageLoader, Spinner } from "@/components/shared/page-loader"
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
import { ErrorView } from "@/components/shared/error-view"
import { cn } from "@/lib/utils"
import {
    withCreateOfferModalLogic,
    type CreateOfferModalLogicProps,
} from "./withCreateOfferModalLogic"

function ChecklistProgressBadge({
    fulfilledCount,
    totalCount,
}: {
    fulfilledCount: number
    totalCount: number
}) {
    if (totalCount === 0) {
        return (
            <span className="inline-flex items-center rounded-full border border-white/60 bg-white/40 px-2.5 py-0.5">
                <Typography as="span" className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                    No checklist
                </Typography>
            </span>
        )
    }

    const allPassed = fulfilledCount === totalCount
    const somePassed = fulfilledCount > 0

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5",
                allPassed
                    ? "border-green-200 bg-green-50 text-green-700"
                    : somePassed
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-gray-200 bg-gray-50 text-gray-600"
            )}
        >
            <Typography
                as="span"
                className={cn(
                    "text-[10px] font-bold uppercase tracking-wide",
                    allPassed
                        ? "text-green-700"
                        : somePassed
                          ? "text-amber-700"
                          : "text-gray-600"
                )}
            >
                {fulfilledCount}/{totalCount} requirements met
            </Typography>
        </span>
    )
}

const CreateOfferModalView = memo(function CreateOfferModalView({
    open,
    onOpenChange,
    studentName,
    programLabel,
    templatePreview,
    isLoading,
    isError,
    errorMessage,
    onRetry,
    onCreateOffer,
    isCreating,
    canCreateOffer,
}: CreateOfferModalLogicProps) {
    const modalDescription = useMemo(() => {
        if (studentName) {
            return `Create an offer for ${studentName} using the template assigned to this application's program.`
        }
        return "Create an offer using the template assigned to this application's program."
    }, [studentName])

    const emptyStateMessage = useMemo(() => {
        if (!programLabel) {
            return "This application's course is not linked to a program yet."
        }
        return `No offer template is assigned to ${programLabel}. Assign one from the Templates page first.`
    }, [programLabel])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Create Offer</DialogTitle>
                    <DialogDescription>{modalDescription}</DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto min-h-0 py-2">
                    {isLoading ? (
                        <PageLoader className="py-16" />
                    ) : isError ? (
                        <div className="space-y-3">
                            <ErrorView message={errorMessage} />
                            <Button type="button" variant="outline" onClick={onRetry}>
                                Retry
                            </Button>
                        </div>
                    ) : !templatePreview ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                            <FileText className="size-10 text-gray-300" />
                            <Typography as="p" className="text-sm font-medium text-gray-500">
                                Offer template not available
                            </Typography>
                            <Typography as="p" className="text-xs text-gray-400 max-w-sm">
                                {emptyStateMessage}
                            </Typography>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-white/60 bg-white/50 p-4 space-y-3">
                            {programLabel ? (
                                <Typography as="p" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Program: {programLabel}
                                </Typography>
                            ) : null}

                            <div className="flex flex-wrap items-center gap-2">
                                <Typography as="p" className="text-sm font-bold text-gray-900">
                                    {templatePreview.template_title}
                                </Typography>
                                <ChecklistProgressBadge
                                    fulfilledCount={templatePreview.fulfilled_count}
                                    totalCount={templatePreview.total_count}
                                />
                            </div>

                            {templatePreview.items.length > 0 ? (
                                <div className="rounded-lg border border-white/50 bg-white/35 p-3 space-y-1.5">
                                    {templatePreview.items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-start gap-2 min-w-0"
                                        >
                                            {item.fulfilled ? (
                                                <CheckCircle2 className="size-3.5 shrink-0 text-green-600 mt-0.5" />
                                            ) : (
                                                <Circle className="size-3.5 shrink-0 text-gray-300 mt-0.5" />
                                            )}
                                            <Typography
                                                as="p"
                                                className={cn(
                                                    "text-[11px] leading-snug",
                                                    item.fulfilled
                                                        ? "text-gray-700"
                                                        : "text-gray-400"
                                                )}
                                            >
                                                {item.label}
                                            </Typography>
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isCreating}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={onCreateOffer}
                        disabled={!canCreateOffer || isCreating}
                        className="gap-2"
                    >
                        {isCreating ? (
                            <>
                                <Spinner size="sm" />
                                Creating...
                            </>
                        ) : (
                            "Create Offer"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
})

export const CreateOfferModal = withCreateOfferModalLogic(CreateOfferModalView)
