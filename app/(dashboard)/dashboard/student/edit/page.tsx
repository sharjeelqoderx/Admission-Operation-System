import { redirect } from "next/navigation"
import { headers } from "next/headers"
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
    ChevronDown,
    Menu,
    Calendar,
    ImagePlus,
    UserPlus,
    UserCircle2,
    FileBadge,
    type LucideIcon
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Typography } from "@/components/shared/Typography"

import { NavContent } from "@/components/shared/NavContent"
import { EditStudentForm } from "@/components/EditStudentForm"
import { Suspense } from "react"

export default async function EditStudentPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-20 px-6 lg:px-12">
            {/* Page Header Area */}
            <div className="space-y-1">
                <Typography as="h2" className="text-[32px] font-extrabold text-gray-900 tracking-tight">
                    Edit Student Profile
                </Typography>
                <Typography as="p" className="text-sm font-medium text-gray-500 leading-relaxed max-w-2xl">
                    Initiate a new student profile and link them to global academic programs. Ensure all mandatory fields are verified before submission.
                </Typography>
            </div>
            
            <div className="w-full h-px bg-white/20" />

            <Suspense fallback={<div className="py-20 text-center"><Typography as="p">Loading form...</Typography></div>}>
                <EditStudentForm />
            </Suspense>
        </div>
    )
}
