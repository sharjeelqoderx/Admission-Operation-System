"use client"
import Link from "next/link"
import {
    FileText,
    GraduationCap,
    Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Typography } from "@/components/shared/Typography"

import { StudentListClient } from "@/components/StudentListClient"
import { useAuth } from "@/hooks/useAuth"
import { PageLoader } from "@/components/shared/page-loader"

export default function StudentsPage() {
    const { me } = useAuth()
    const { data, isLoading, status } = me

    if (isLoading || status === "pending") {
        return <PageLoader label="Loading students..." />
    }

    const fullName = data?.fullName || "Benson Ronald"
    const role = data?.role || "AGENT"
    const initials = fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()

    return (
        <main className="relative overflow-x-hidden">

            {/* Content */}
            <div className="relative z-10">
                <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 lg:py-10 space-y-8">
                    {/* Page Header Area */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1 max-w-2xl">
                            <Typography as="h2" className="text-[28px] font-bold text-gray-900 tracking-tight">
                                All students
                            </Typography>
                            <Typography as="p" className="text-sm text-gray-600 leading-relaxed">
                                Initiate a new student profile and link them to global academic programs. Ensure all mandatory fields are verified before submission.
                            </Typography>
                        </div>
                        <Link href="/dashboard/student/new">
                            <Button className="bg-brand-byzantine hover:bg-brand-byzantine text-white px-6 h-11 rounded-md shrink-0 shadow-md">
                                <Plus className="size-4 mr-2" />
                                <Typography as="span" className="text-inherit font-medium">Add Student</Typography>
                            </Button>
                        </Link>
                    </div>

                    {/* Stats Header Area */}
                    <div className="bg-white/10 backdrop-blur-sm border-x border-white/40 rounded-l-lg rounded-r-lg rounded-2xl p-8 flex flex-col md:flex-row items-center gap-16">
                        <div className="flex items-center gap-6">
                            <div className="size-14 border-x border-white/40 rounded-l-lg rounded-r-lg bg-white/20 flex items-center justify-center">
                                <GraduationCap className="size-7 text-gray-800" />
                            </div>
                            <div className="flex flex-col">
                                <Typography as="span" className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                    Total Students
                                </Typography>
                                <Typography as="span" className="text-[34px] font-extrabold text-gray-900 leading-none mt-1">
                                    1,284
                                </Typography>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="size-14 border-x border-white/40 rounded-l-lg rounded-r-lg bg-white/20 flex items-center justify-center">
                                <FileText className="size-7 text-gray-800" />
                            </div>
                            <div className="flex flex-col">
                                <Typography as="span" className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                    Active Applications
                                </Typography>
                                <Typography as="span" className="text-[34px] font-extrabold text-gray-900 leading-none mt-1">
                                    422
                                </Typography>
                            </div>
                        </div>
                    </div>

                    {/* List Section */}
                    <StudentListClient />
                </div>
            </div>
        </main>
    )
}