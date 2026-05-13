"use client"
import { Typography } from "@/components/shared/Typography"
import { StudentForm } from "@/components/StudentForm"
import { BluryCard } from "@/components/shared/blury-card"

export default function AddStudentPage() {
    return (
        <main className="min-h-screen pt-4">
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-xl"
                blendColorClass="bg-white/20"
                className="max-w-5xl mx-auto rounded-3xl overflow-hidden"
                childClass="p-0!"
            >
                <div className="flex flex-col gap-2 p-8 pb-6 border-b border-white/20 bg-white/10">
                    <Typography as="h2" className="text-[28px] font-extrabold text-brand-secondary tracking-tight">
                        Add New Student
                    </Typography>
                    <Typography as="p" className="text-[14px] text-gray-500 font-medium max-w-3xl leading-relaxed">
                        Create a comprehensive student profile. All information will be securely stored and used for academic processing.
                    </Typography>
                </div>

                <div className="bg-white/5">
                    <StudentForm mode="create" />
                </div>
            </BluryCard>
        </main>
    )
}

