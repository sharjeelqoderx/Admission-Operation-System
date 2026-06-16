"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { Typography } from "@/components/shared/Typography"
import { Button } from "@/components/ui/button"
import { BluryCard } from "@/components/shared/blury-card"
import { PageLoader } from "@/components/shared/page-loader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import {
    ChevronLeft,
    User,
    GraduationCap,
    FileText,
    Calendar,
    Mail,
    Globe,
    Building2,
    Clock,
    CheckCircle2
} from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatIntakeDate } from "@/lib/utils/program"

export default function ApplicationDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const id = params?.id as string

    const { data: application, isLoading, isError } = useQuery({
        queryKey: ["application", id],
        queryFn: async () => {
            const res = await fetch(`/api/application/${id}`)
            const json = await res.json()
            if (!res.ok) throw new Error(json.error)
            return json.data
        },
        enabled: !!id
    })

    if (isLoading) return <PageLoader label="Loading application details..." />

    if (isError || !application) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Typography className="font-bold text-gray-700">Application not found</Typography>
                <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
            </div>
        )
    }

    const student = application.student
    const course = application.course
    const degree = course?.degree
    const university = application.university
    const documents = application.documents || []

    return (
        <div className="space-y-6 sm:space-y-8">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-full shrink-0 size-9 sm:size-10">
                        <ChevronLeft className="size-5" />
                    </Button>
                    <div className="space-y-0.5">
                        <Typography as="h1" font="title" className="text-xl sm:text-2xl font-bold tracking-tight">
                            Application Details
                        </Typography>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <Typography className="text-[10px] font-medium text-gray-500 uppercase tracking-widest whitespace-nowrap">
                                {application.application_no || "APP-" + application.id.slice(0, 8).toUpperCase()}
                            </Typography>
                            <span className="text-gray-300 hidden xs:inline">•</span>
                            <StatusBadge status={application.status} />
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                    <Link href={`/dashboard/application/new?student_id=${student?.id}`} className="w-full sm:w-auto">
                        <Button variant="outline" className="h-10 px-4 sm:px-6 rounded-xl font-bold text-xs border-gray-200 w-full">
                            New Application
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Student & Program Info */}
                <div className="lg:col-span-2 space-y-6 sm:space-y-8">

                    {/* Student Info Card */}
                    <BluryCard isCentered={false} className="rounded-2xl" childClass="p-5 sm:p-8 space-y-6">
                        <div className="flex items-center gap-2 text-brand-byzantine">
                            <User className="size-5" />
                            <Typography font="title" className="text-lg font-bold">Student Information</Typography>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
                            <div className="size-20 sm:size-24 rounded-2xl overflow-hidden border-2 border-white shadow-sm shrink-0 bg-gray-50">
                                <Avatar className="w-full h-full rounded-none">
                                    <AvatarImage src={student?.avatar_url} />
                                    <AvatarFallback className="text-xl sm:text-2xl font-bold">{student?.name?.[0]}</AvatarFallback>
                                </Avatar>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 flex-1 w-full">
                                <div className="space-y-1">
                                    <Typography className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name</Typography>
                                    <Typography className="font-bold text-gray-900">{student?.name}</Typography>
                                </div>
                                <div className="space-y-1">
                                    <Typography className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</Typography>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Mail className="size-3.5" />
                                        <Typography className="text-sm font-medium">{student?.email}</Typography>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Typography className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date of Birth</Typography>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Calendar className="size-3.5" />
                                        <Typography className="text-sm font-medium">
                                            {student?.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : "N/A"}
                                        </Typography>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Typography className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gender</Typography>
                                    <Typography className="text-sm font-medium text-gray-700">{student?.gender || "N/A"}</Typography>
                                </div>
                            </div>
                        </div>
                    </BluryCard>

                    {/* Program Info Card */}
                    <BluryCard isCentered={false} className="rounded-2xl" childClass="p-5 sm:p-8 space-y-6">
                        <div className="flex items-center gap-2 text-brand-secondary">
                            <GraduationCap className="size-5" />
                            <Typography font="title" className="text-lg font-bold">Course Selection</Typography>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <Typography className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">University</Typography>
                                    <div className="flex items-center gap-2">
                                        <Building2 className="size-4 text-gray-400" />
                                        <Typography className="font-bold text-brand-secondary">{university?.name || "N/A"}</Typography>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Typography className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Course</Typography>
                                    <Typography className="font-bold text-brand-secondary text-lg leading-tight">{course?.name}</Typography>
                                </div>
                                <div className="space-y-1">
                                    <Typography className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Degree</Typography>
                                    <Typography className="font-bold text-brand-secondary">{degree?.name ?? "N/A"}</Typography>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <Typography className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Intake</Typography>
                                    <div className="flex items-center gap-2">
                                        <Clock className="size-4 text-gray-400" />
                                        <Typography className="font-bold text-brand-secondary">{formatIntakeDate(degree?.intake_date)}</Typography>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Typography className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fees</Typography>
                                    <Typography className="font-bold text-brand-secondary">{degree?.fees || "Contact University"}</Typography>
                                </div>
                                <div className="space-y-1">
                                    <Typography className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Date</Typography>
                                    <Typography className="font-bold text-brand-secondary">{course?.deadline_date || "N/A"}</Typography>
                                </div>
                            </div>
                        </div>
                    </BluryCard>

                </div>

                {/* Right Column: Documents & Status */}
                <div className="space-y-6 sm:space-y-8">

                    {/* Status Summary */}
                    <BluryCard isCentered={false} className="rounded-2xl border-l-4 border-l-brand-byzantine" childClass="p-5 sm:p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <Typography className="text-xs font-bold text-gray-400 uppercase tracking-widest">Submission Status</Typography>
                            <StatusBadge status={application.status} />
                        </div>
                        <div className="pt-2">
                            <Typography className="text-xs text-gray-500 font-medium">
                                Submitted on {new Date(application.created_at).toLocaleDateString('en-US', { dateStyle: 'long' })}
                            </Typography>
                            <Typography className="text-xs text-gray-500 font-medium mt-1">
                                Submitted by: {application.agent?.name || "System"}
                            </Typography>
                        </div>
                    </BluryCard>

                    {/* Attached Documents */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileText className="size-5 text-gray-400" />
                                <Typography className="font-bold text-gray-900">Attached Documents</Typography>
                            </div>
                            <span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                {documents.length}
                            </span>
                        </div>

                        <div className="space-y-3">
                            {documents.map((docItem: any, i: number) => {
                                const doc = docItem.document;
                                if (!doc) return null;
                                return (
                                    <div key={i} className="bg-white/60 backdrop-blur-md border border-white/60 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-1">
                                                <Typography className="text-sm font-bold text-gray-900 leading-tight">{doc.document_type?.name ?? "Document"}</Typography>
                                                <Typography className="text-[10px] text-gray-500 font-medium uppercase">
                                                    {doc.document_files?.length || 0} Files • {new Date(doc.created_at).toLocaleDateString()}
                                                </Typography>
                                            </div>
                                            <StatusBadge status={doc.document_review?.[0]?.status || "PENDING"} />
                                        </div>

                                        <div className="flex gap-2">
                                            <Link href={`/dashboard/document/student/${student?.id}/${doc.id}`} className="flex-1">
                                                <Button variant="outline" className="w-full h-9 text-[11px] font-bold rounded-lg border-gray-200">
                                                    View Files
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                )
                            })}

                            {documents.length === 0 && (
                                <div className="text-center py-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                    <Typography className="text-xs text-gray-400 font-medium">No documents attached</Typography>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>

        </div>
    )
}
