"use client"

import { memo, useCallback, useEffect, useState } from "react"
import { Typography } from "@/components/shared/Typography"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"

type Props = {
    open: boolean
    documentName: string
    isSubmitting: boolean
    errorMessage?: string
    onOpenChange: (open: boolean) => void
    onSubmit: (reason: string) => void
}

export const RejectDocumentDialog = memo(function RejectDocumentDialog({
    open,
    documentName,
    isSubmitting,
    errorMessage,
    onOpenChange,
    onSubmit,
}: Props) {
    const [reason, setReason] = useState("")
    const [touched, setTouched] = useState(false)

    useEffect(() => {
        if (!open) {
            setReason("")
            setTouched(false)
        }
    }, [open])

    const handleOpenChange = useCallback(
        (nextOpen: boolean) => {
            if (!nextOpen) {
                setReason("")
                setTouched(false)
            }
            onOpenChange(nextOpen)
        },
        [onOpenChange]
    )

    const handleSubmit = useCallback(() => {
        setTouched(true)
        if (!reason.trim()) return
        onSubmit(reason.trim())
    }, [onSubmit, reason])

    const isInvalid = touched && !reason.trim()

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Reject Document</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <Typography as="p" font="sub-text" className="text-gray-600">
                        Provide a reason for rejecting{" "}
                        <Typography as="span" className="font-semibold text-gray-900">
                            {documentName}
                        </Typography>
                        . The student will see this feedback.
                    </Typography>

                    <FieldGroup>
                        <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor="reject-reason">Rejection reason</FieldLabel>
                            <textarea
                                id="reject-reason"
                                value={reason}
                                onChange={(event) => setReason(event.target.value)}
                                placeholder="Explain what needs to be corrected..."
                                className="w-full min-h-[120px] rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-byzantine resize-none"
                                disabled={isSubmitting}
                            />
                            {isInvalid && (
                                <FieldError errors={[{ message: "Rejection reason is required" }]} />
                            )}
                        </Field>
                    </FieldGroup>

                    {errorMessage && (
                        <Typography as="p" className="text-sm text-red-600">
                            {errorMessage}
                        </Typography>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Submitting..." : "Reject Document"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
})
