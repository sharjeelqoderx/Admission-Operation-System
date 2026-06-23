"use client"

import { memo } from "react"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { StudentForm } from "../../../_components/student-form"
import type { StudentFormPageData } from "@/lib/student/server"

type PageContentProps = {
    studentId: string
    initialData: StudentFormPageData
}

function EditStudentPageView({ studentId, initialData }: PageContentProps) {
    return (
        <BluryCard
            isCentered={false}
            blurAmount="backdrop-blur-xl"
            blendColorClass="bg-white/20"
            className=""
            childClass="p-0!"
        >
            <div className="space-y-1 max-w-2xl p-6 border-b-2 border-gray-300">
                <Typography as="h2" font="sub-heading" className="font-bold tracking-tight">
                    Edit Student Profile
                </Typography>
                <Typography
                    as="p"
                    font="sub-text"
                    className="text-gray-500 font-medium max-w-2xl leading-relaxed"
                >
                    Update the student profile and verify all mandatory fields before saving changes.
                </Typography>
            </div>

            <StudentForm
                mode="edit"
                studentId={studentId}
                defaultData={initialData}
            />
        </BluryCard>
    )
}

const EditStudentPageContent = memo(EditStudentPageView)
EditStudentPageContent.displayName = "EditStudentPageContent"

export function PageContent({ studentId, initialData }: PageContentProps) {
    return <EditStudentPageContent studentId={studentId} initialData={initialData} />
}
