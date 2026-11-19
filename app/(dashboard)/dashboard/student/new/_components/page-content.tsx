"use client"

import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { StudentForm } from "../../_components/student-form"
export function PageContent() {
    return (
        <BluryCard
            isCentered={false}
            blurAmount="backdrop-blur-xl"
            blendColorClass="bg-white/20"
            className=""
            childClass="p-0!"
        >
            <div className="border-b-2 border-gray-300">
                <div className="space-y-1 max-w-2xl p-6">
                    <Typography as="h2" font="sub-heading" className="font-bold tracking-tight">
                        Add New Student
                    </Typography>
                    <Typography
                        as="p"
                        font="sub-text"
                        className="text-gray-500 font-medium max-w-2xl leading-relaxed"
                    >
                        Create a comprehensive student profile. All information will be securely stored
                        and used for academic processing.
                    </Typography>
                </div>
            </div>

            <StudentForm mode="create" />
        </BluryCard>
    )
}
