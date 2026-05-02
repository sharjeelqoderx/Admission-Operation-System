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
            <div className="relative z-10 max-w-7xl mx-auto space-y-10 border-x border-white/40 rounded-l-lg rounded-r-lg">
                <div className="flex flex-col gap-2 p-8 m-0 pb-4 border-b-2 border-gray-300">
                    <Typography as="h2" className="text-[24px] font-extrabold text-gray-900 tracking-tight">
                        Add New Student
                    </Typography>
                    <Typography as="p" className="text-[15px] text-gray-600 font-medium max-w-3xl leading-relaxed opacity-80">
                        Create a comprehensive student profile. All information will be securely stored and used for academic processing.
                    </Typography>
                </div>

                {/* <div className="w-full h- bg-gray-200/60" /> */}

                <AddStudentForm />
            </div>
        </main>
    )
}