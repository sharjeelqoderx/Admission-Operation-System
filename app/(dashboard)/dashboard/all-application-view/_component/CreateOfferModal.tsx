"use client"

import { memo, useMemo } from "react"
import { CheckCircle2, Circle, FileText, Loader2 } from "lucide-react"
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
    templates,
    checklistByTemplateId,
    isLoading,
    isError,
    errorMessage,
    onRetry,
    selectedTemplateId,
    onSelectTemplate,
    onCreateOffer,
    isCreating,
}: CreateOfferModalLogicProps) {
    const modalDescription = useMemo(() => {
        if (studentName) {
            return `Select an offer template to create an offer for ${studentName}. Checklist progress reflects this student's approved documents and payment.`
        }
        return "Select an offer template to create an offer for this application. Checklist progress reflects approved documents and payment."
    }, [studentName])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Create Offer</DialogTitle>
                    <DialogDescription>{modalDescription}</DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto min-h-0 py-2">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <Loader2 className="size-8 text-brand-secondary animate-spin" />
                            <Typography as="p" className="text-sm font-medium text-gray-500">
                                Loading offer templates...
                            </Typography>
                        </div>
                    ) : isError ? (
                        <div className="space-y-3">
                            <ErrorView message={errorMessage} />
                            <Button type="button" variant="outline" onClick={onRetry}>
                                Retry
                            </Button>
                        </div>
                    ) : templates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                            <FileText className="size-10 text-gray-300" />
                            <Typography as="p" className="text-sm font-medium text-gray-500">
                                No offer templates found.
                            </Typography>
                            <Typography as="p" className="text-xs text-gray-400 max-w-sm">
                                Create templates from the Templates page first, then return here to attach one to this application.
                            </Typography>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {templates.map((template) => {
                                const isSelected = selectedTemplateId === template.id
                                const checklist = checklistByTemplateId[template.id]
                                const fulfilledCount = checklist?.fulfilled_count ?? 0
                                const totalCount = checklist?.total_count ?? template.checklist_items.length
                                const items = checklist?.items ?? []

                                return (
                                    <button
                                        key={template.id}
                                        type="button"
                                        disabled={isCreating}
                                        onClick={() => onSelectTemplate(template.id)}
                                        className={cn(
                                            "w-full text-left rounded-xl border p-4 transition-colors",
                                            "bg-white/50 hover:bg-white/80 border-white/60",
                                            "disabled:opacity-60 disabled:cursor-not-allowed",
                                            isSelected &&
                                                "border-brand-byzantine bg-brand-byzantine/5 ring-1 ring-brand-byzantine/30"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1 space-y-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Typography
                                                        as="p"
                                                        className="text-sm font-bold text-gray-900"
                                                    >
                                                        {template.title}
                                                    </Typography>
                                                    <ChecklistProgressBadge
                                                        fulfilledCount={fulfilledCount}
                                                        totalCount={totalCount}
                                                    />
                                                </div>
                                                <Typography as="p" className="text-xs text-gray-500">
                                                    Updated{" "}
                                                    {new Date(template.updated_at).toLocaleDateString(
                                                        "en-US",
                                                        {
                                                            month: "short",
                                                            day: "numeric",
                                                            year: "numeric",
                                                        }
                                                    )}
                                                </Typography>
                                                {items.length > 0 ? (
                                                    <div className="rounded-lg border border-white/50 bg-white/35 p-3 space-y-1.5">
                                                        {items.map((item) => (
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
                                                {(template.variables?.length ?? 0) > 0 && (
                                                    <Typography
                                                        as="p"
                                                        className="text-[11px] text-gray-400 truncate"
                                                    >
                                                        Variables:{" "}
                                                        {(template.variables ?? [])
                                                            .map((v) => `{{${v}}}`)
                                                            .join(", ")}
                                                    </Typography>
                                                )}
                                            </div>
                                            <div
                                                className={cn(
                                                    "size-5 shrink-0 rounded-full border-2 flex items-center justify-center",
                                                    isSelected
                                                        ? "border-brand-byzantine bg-brand-byzantine"
                                                        : "border-gray-300 bg-white"
                                                )}
                                            >
                                                {isSelected ? (
                                                    <div className="size-2 rounded-full bg-white" />
                                                ) : null}
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}
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
                        disabled={!selectedTemplateId || isCreating || templates.length === 0}
                        className="gap-2"
                    >
                        {isCreating ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
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
