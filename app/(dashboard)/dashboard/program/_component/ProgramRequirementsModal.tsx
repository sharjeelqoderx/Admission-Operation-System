"use client"

import { memo } from "react"
import { FileText } from "lucide-react"
import { Typography } from "@/components/shared/Typography"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import type { CourseProgram } from "@/types/schemas/program"

type ProgramRequirementsModalProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    course: CourseProgram | null
}

export const ProgramRequirementsModal = memo(function ProgramRequirementsModal({
    open,
    onOpenChange,
    course,
}: ProgramRequirementsModalProps) {
    const requirements = course?.degree?.requirements ?? []

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Admission Requirements</DialogTitle>
                    <DialogDescription>
                        {course?.name ?? "Program"} — required documents for your application.
                    </DialogDescription>
                </DialogHeader>

                {requirements.length === 0 ? (
                    <Typography font="sub-text" className="text-gray-500 py-4">
                        No requirements listed for this program yet.
                    </Typography>
                ) : (
                    <div className="space-y-3">
                        {requirements.map((requirement) => {
                            const doc = requirement.document_type
                            if (!doc) return null

                            return (
                                <div
                                    key={requirement.id}
                                    className="flex gap-3 rounded-xl border border-gray-100 bg-white/60 p-4"
                                >
                                    <div className="mt-0.5 shrink-0 h-auto rounded-lg bg-brand-blue/10 p-2 text-brand-blue">
                                        <FileText className="size-4" />
                                    </div>
                                    <div className="space-y-1 min-w-0">
                                        <Typography font="sub-text" className="font-bold text-gray-900">
                                            {doc.name}
                                        </Typography>
                                        {doc.type && (
                                            <Typography font="small" className="text-brand-byzantine uppercase tracking-wide">
                                                {doc.type}
                                            </Typography>
                                        )}
                                        {doc.description && (
                                            <Typography font="small" className="text-gray-600 leading-relaxed">
                                                {doc.description}
                                            </Typography>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
})
