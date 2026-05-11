"use client"
import { Typography } from "@/components/shared/Typography"
import { StudentForm } from "@/components/StudentForm"

export default function AddStudentPage() {
    return (
        <main className="min-h-screen">
            <div className="relative z-10 mx-auto space-y-10 border-x border-white/40 rounded-l-lg rounded-r-lg">
                <div className="flex flex-col gap-2 p-8 m-0 pb-4 border-b-2 border-gray-300">
                    <Typography as="h2" className="text-[24px] font-extrabold text-gray-900 tracking-tight">
                        Add New Student
                    </Typography>
                    <Typography as="p" className="text-[15px] text-gray-600 font-medium max-w-3xl leading-relaxed opacity-80">
                        Create a comprehensive student profile. All information will be securely stored and used for academic processing.
                    </Typography>
                </div>

                <StudentForm mode="create" />
            </div>
        </main>
    )
}
