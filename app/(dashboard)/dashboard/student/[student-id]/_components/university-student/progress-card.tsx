"use client"

import { memo } from "react"
import { CheckCircle2, Circle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Typography } from "@/components/shared/Typography"
import type { UniversityStudentDetail } from "@/types/schemas/university-student"

type StudentProgressCardProps = {
    progress: UniversityStudentDetail["progress"]
}

export const StudentProgressCard = memo(function StudentProgressCard({
    progress,
}: StudentProgressCardProps) {
    return (
        <Card className="border-none bg-white px-5 py-6 shadow-sm ring-1 ring-black/5">
            <Typography as="h3" font="title" className="font-bold text-brand-primary">
                Progress
            </Typography>
            {progress.program_name ? (
                <Typography as="p" font="sub-text" className="mt-1 text-brand-blue">
                    {progress.program_name}
                </Typography>
            ) : null}

            <div className="mt-6 space-y-5">
                {progress.steps.map((step) => {
                    const isCompleted = step.status === "completed"

                    return (
                        <div key={step.key} className="flex items-start gap-3">
                            {isCompleted ? (
                                <CheckCircle2 className="mt-0.5 size-5 text-brand-success" />
                            ) : (
                                <Circle className="mt-0.5 size-5 text-gray-300" />
                            )}
                            <div className="space-y-1">
                                <Typography as="p" font="text" className="font-semibold text-brand-primary">
                                    {step.label}
                                </Typography>
                                <Typography as="p" font="sub-text" className="text-gray-500">
                                    {step.meta ?? "Pending"}
                                </Typography>
                            </div>
                        </div>
                    )
                })}
            </div>
        </Card>
    )
})
