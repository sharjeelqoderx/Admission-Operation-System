"use client"
import { Typography } from "@/components/shared/Typography"
import { AddStudentForm } from "@/components/AddStudentForm"
import { useAuth } from "@/hooks/useAuth"
import { PageLoader } from "@/components/shared/page-loader"

export default function AddStudentPage() {
    const { me } = useAuth()
    const { data, isLoading, status } = me

    if (isLoading || status === "pending") {
        return <PageLoader label="Loading profile..." />
    }

    const fullName = data?.fullName || "Benson Ronald"
    const role = data?.role || "AGENT"
    const initials = fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()

    return (
        <main className="min-h-screen">
            <div className="relative z-10 max-w-5xl mx-auto space-y-8">
                <div className="space-y-1">
                    <Typography as="h2" className="text-[28px] font-bold text-gray-900 tracking-tight">
                        Add New Student
                    </Typography>
                    <Typography as="p" className="text-sm text-gray-600 leading-relaxed max-w-2xl">
                        Initiate a new student profile and link them to global academic programs. Ensure all mandatory fields are verified before submission.
                    </Typography>
                </div>

                <div className="w-full h-px bg-gray-200/60" />

                <AddStudentForm />
            </div>
        </main>
    )
}