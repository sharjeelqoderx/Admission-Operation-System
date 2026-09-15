"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Typography } from "@/components/shared/Typography"
import { DatePicker } from "@/components/shared/date-picker"
import { ErrorView } from "@/components/shared/error-view"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

type DeferIntakeDialogProps = {
    open: boolean
    studentName: string
    currentIntake: string | null
    isSubmitting: boolean
    errorMessage: string | null
    onOpenChange: (open: boolean) => void
    onSubmit: (reason: string, newIntakeDate: string) => void
}

export function DeferIntakeDialog({
    open,
    studentName,
    currentIntake,
    isSubmitting,
    errorMessage,
    onOpenChange,
    onSubmit,
}: DeferIntakeDialogProps) {
    const [reason, setReason] = useState("")
    const [newIntakeDate, setNewIntakeDate] = useState("")

    const handleSubmit = () => {
        if (!reason.trim()) {
            return
        }
        if (!newIntakeDate) {
            return
        }
        onSubmit(reason.trim(), newIntakeDate)
    }

    const handleOpenChange = (newOpen: boolean) => {
        if (!isSubmitting) {
            onOpenChange(newOpen)
            if (!newOpen) {
                setReason("")
                setNewIntakeDate("")
            }
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Defer Intake for {studentName}</DialogTitle>
                    <DialogDescription>
                        Defer this application to a new intake. The current application will be marked as rejected
                        with your reason, and a new application will be created for the selected intake.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {currentIntake && (
                        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                            <Typography as="p" className="text-sm text-amber-800">
                                <strong>Current Intake:</strong> {currentIntake}
                            </Typography>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Typography as="label" className="text-sm font-semibold text-gray-900">
                            New Intake Date <span className="text-red-500">*</span>
                        </Typography>
                        <DatePicker
                            value={newIntakeDate}
                            onChange={(value) => setNewIntakeDate(value || "")}
                            placeholder="Select new intake date"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Typography as="label" className="text-sm font-semibold text-gray-900">
                            Reason for Deferral <span className="text-red-500">*</span>
                        </Typography>
                        <Textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g., Visa processing delayed, document submission incomplete..."
                            className="min-h-[100px] resize-none"
                            disabled={isSubmitting}
                        />
                        <Typography as="p" className="text-xs text-gray-500">
                            This reason will be recorded in the rejection history
                        </Typography>
                    </div>

                    {errorMessage && <ErrorView message={errorMessage} />}
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
                        onClick={handleSubmit}
                        disabled={isSubmitting || !reason.trim() || !newIntakeDate}
                        className="bg-amber-600 hover:bg-amber-700"
                    >
                        {isSubmitting ? "Deferring..." : "Defer Intake"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
