"use client"
import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
    LayoutDashboard,
    Users,
    FileText,
    BookOpen,
    Files,
    Award,
    CreditCard,
    BadgeDollarSign,
    MessageSquare,
    UserCircle,
    Bell,
    Search,
    GraduationCap,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Menu,
    Plus,
    Eye,
    Pencil,
    Trash2,
    UserPlus,
    UserCircle2
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Typography } from "@/components/shared/Typography"

import { NavContent } from "@/components/shared/NavContent"
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
        <main className="relative">

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
                            <Button className="bg-[#9B51E0] hover:bg-[#8a42cf] text-white px-6 h-11 rounded-md shrink-0 shadow-md">
                                <Plus className="size-4 mr-2" />
                                <Typography as="span" className="text-inherit font-medium">Add Student</Typography>
                            </Button>
                        </Link>
                    </div>

                    {/* Minimal Stats */}
                    <div className="flex flex-col sm:flex-row gap-8 py-2">
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-full bg-white/60 shadow-sm flex items-center justify-center border border-white shrink-0">
                                <GraduationCap className="size-5 text-gray-800" />
                            </div>
                            <div className="flex flex-col">
                                <Typography as="span" className="text-xs font-semibold text-gray-800 tracking-wide">
                                    Total Students
                                </Typography>
                                <Typography as="span" className="text-[28px] font-bold text-gray-900 leading-none mt-1">
                                    1,284
                                </Typography>
                            </div>
                        </div>

                        <div className="hidden sm:block w-px h-12 bg-gray-300/50" />

                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-full bg-white/60 shadow-sm flex items-center justify-center border border-white shrink-0">
                                <FileText className="size-5 text-gray-800" />
                            </div>
                            <div className="flex flex-col">
                                <Typography as="span" className="text-xs font-semibold text-gray-800 tracking-wide">
                                    Active Applications
                                </Typography>
                                <Typography as="span" className="text-[28px] font-bold text-gray-900 leading-none mt-1">
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