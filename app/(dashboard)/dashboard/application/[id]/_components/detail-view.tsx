"use client"

import { memo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Typography } from "@/components/shared/Typography"
import { Button } from "@/components/ui/button"
import { BluryCard } from "@/components/shared/blury-card"
import { ErrorView } from "@/components/shared/error-view"
import { DetailPageSkeleton } from "@/components/shared/page-skeleton"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ApplicationStatusBadge } from "../../_components/application-status-badge"
import { ApplicationReviewHistoryCard } from "../../_components/application-review-history-card"
import { applicationDetailCardClassName } from "../../_components/application-detail-card-styles"
import {
    ChevronLeft,
    User,
    GraduationCap,
    FileText,
    Calendar,
    Mail,
    Building2,
    Clock,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatFullName } from "@/lib/utils/profile"
import { formatIntakeDate } from "@/lib/utils/program"
import type { ApplicationDetailLogicProps } from "./withApplicationDetailLogic"

const ApplicationDetailView = memo(function ApplicationDetailView({
    application,
    isLoading,
    isError,
    errorMessage,
    onRetry,
}: ApplicationDetailLogicProps) {
    const router = useRouter()

    if (isLoading) {
        return <DetailPageSkeleton />
    }

    if (isError || !application) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
                <ErrorView message={errorMessage} />
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => router.back()}>
                        Go Back
                    </Button>
                    <Button onClick={onRetry}>Retry</Button>
                </div>
            </div>
        )
    }

    const student = application.student
    const course = application.course
    const degree = course?.degree
    const university = application.university
    const documents = application.documents ?? []
    const studentName = formatFullName(student?.first_name, student?.last_name, "—")
    const agentName = formatFullName(
        application.agent?.first_name,
        application.agent?.last_name,
        "System"
    )
    const universityName = formatFullName(
        university?.first_name,
        university?.last_name,
        "N/A"
    )

    return (
        <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.back()}
                        className="rounded-full shrink-0 size-9 sm:size-10"
                    >
                        <ChevronLeft className="size-5" />
                    </Button>
                    <div className="space-y-0.5">
                        <Typography as="h1" className="text-lg font-semibold text-foreground">
                            Application Details
                        </Typography>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <Typography as="span" className="text-xs text-muted-foreground whitespace-nowrap">
                                {application.application_no ||
                                    `APP-${application.id.slice(0, 8).toUpperCase()}`}
                            </Typography>
                            <Typography as="span" className="text-gray-300 hidden xs:inline">
                                •
                            </Typography>
                            <ApplicationStatusBadge
                                status={application.status}
                                offerLetter={application.offer_letter}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                    {application.can_resubmit ? (
                        <Link
                            href={`/dashboard/application/${application.id}/edit`}
                            className="w-full sm:w-auto"
                        >
                            <Button className="h-10 px-4 sm:px-6 rounded-xl font-bold text-xs w-full bg-brand-secondary hover:bg-brand-secondary/90">
                                Edit & Resubmit
                            </Button>
                        </Link>
                    ) : null}
                    <Link
                        href={`/dashboard/application/new?student_id=${student?.id}`}
                        className="w-full sm:w-auto"
                    >
                        <Button
                            variant="outline"
                            className="h-10 px-4 sm:px-6 rounded-xl font-bold text-xs border-gray-200 w-full"
                        >
                            New Application
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                    <BluryCard
                        isCentered={false}
                        className={`rounded-2xl ${applicationDetailCardClassName}`}
                        childClass="p-5 sm:p-8 space-y-6"
                    >
                        <div className="flex items-center gap-2 text-brand-byzantine">
                            <User className="size-5" />
                            <Typography font="title" className="text-base font-semibold">
                                Student Information
                            </Typography>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
                            <div className="size-20 sm:size-24 rounded-2xl overflow-hidden shrink-0 bg-gray-50">
                                <Avatar className="w-full h-full rounded-none">
                                    <AvatarImage src={student?.avatar_url ?? undefined} />
                                    <AvatarFallback className="text-xl sm:text-2xl font-bold">
                                        {studentName[0]}
                                    </AvatarFallback>
                                </Avatar>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 flex-1 w-full">
                                <div className="space-y-1">
                                    <Typography className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                                        Full Name
                                    </Typography>
                                    <Typography className="text-sm font-medium text-foreground">
                                        {studentName}
                                    </Typography>
                                </div>
                                <div className="space-y-1">
                                    <Typography className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Email Address
                                    </Typography>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Mail className="size-3.5" />
                                        <Typography className="text-sm font-medium">
                                            {student?.email}
                                        </Typography>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Typography className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Date of Birth
                                    </Typography>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Calendar className="size-3.5" />
                                        <Typography className="text-sm font-medium">
                                            {student?.date_of_birth
                                                ? new Date(student.date_of_birth).toLocaleDateString()
                                                : "N/A"}
                                        </Typography>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Typography className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Gender
                                    </Typography>
                                    <Typography className="text-sm font-medium text-gray-700">
                                        {student?.gender || "N/A"}
                                    </Typography>
                                </div>
                            </div>
                        </div>
                    </BluryCard>

                    <BluryCard
                        isCentered={false}
                        className={`rounded-2xl ${applicationDetailCardClassName}`}
                        childClass="p-5 sm:p-8 space-y-6"
                    >
                        <div className="flex items-center gap-2 text-brand-secondary">
                            <GraduationCap className="size-5" />
                            <Typography font="title" className="text-base font-semibold">
                                Course Selection
                            </Typography>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <Typography className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        University
                                    </Typography>
                                    <div className="flex items-center gap-2">
                                        <Building2 className="size-4 text-gray-400" />
                                        <Typography className="font-bold text-brand-secondary">
                                            {universityName}
                                        </Typography>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Typography className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Course
                                    </Typography>
                                    <Typography className="font-bold text-brand-secondary text-lg leading-tight">
                                        {course?.name}
                                    </Typography>
                                </div>
                                <div className="space-y-1">
                                    <Typography className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Degree
                                    </Typography>
                                    <Typography className="font-bold text-brand-secondary">
                                        {degree?.name ?? "N/A"}
                                    </Typography>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <Typography className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Intake
                                    </Typography>
                                    <div className="flex items-center gap-2">
                                        <Clock className="size-4 text-gray-400" />
                                        <Typography className="font-bold text-brand-secondary">
                                            {formatIntakeDate(degree?.intake_date)}
                                        </Typography>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Typography className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Fees
                                    </Typography>
                                    <Typography className="font-bold text-brand-secondary">
                                        {degree?.fees || "Contact University"}
                                    </Typography>
                                </div>
                                <div className="space-y-1">
                                    <Typography className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Last Date
                                    </Typography>
                                    <Typography className="font-bold text-brand-secondary">
                                        {course?.deadline_date || "N/A"}
                                    </Typography>
                                </div>
                            </div>
                        </div>
                    </BluryCard>

                    <ApplicationReviewHistoryCard history={application.review_history} />
                </div>

                <div className="space-y-6 sm:space-y-8">
                    <BluryCard
                        isCentered={false}
                        className={`rounded-2xl ${applicationDetailCardClassName}`}
                        childClass="p-5 sm:p-6 space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <Typography className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                Submission Status
                            </Typography>
                            <ApplicationStatusBadge
                                status={application.status}
                                offerLetter={application.offer_letter}
                            />
                        </div>
                        <div className="pt-2">
                            <Typography className="text-xs text-gray-500 font-medium">
                                Submitted on{" "}
                                {new Date(application.created_at).toLocaleDateString("en-US", {
                                    dateStyle: "long",
                                })}
                            </Typography>
                            <Typography className="text-xs text-gray-500 font-medium mt-1">
                                Submitted by: {agentName}
                            </Typography>
                        </div>
                    </BluryCard>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileText className="size-5 text-gray-400" />
                                <Typography className="font-bold text-gray-900">
                                    Attached Documents
                                </Typography>
                            </div>
                            <Typography
                                as="span"
                                className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                            >
                                {documents.length}
                            </Typography>
                        </div>

                        <div className="space-y-3">
                            {documents.map((docItem, index) => {
                                const doc = docItem.document
                                if (!doc) return null

                                const reviewStatus = doc.document_review?.[0]?.status || "PENDING"

                                return (
                                    <div
                                        key={doc.id ?? index}
                                        className="rounded-xl bg-white/60 p-4 backdrop-blur-md flex flex-col gap-3"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-1">
                                                <Typography className="text-sm font-bold text-gray-900 leading-tight">
                                                    {doc.document_type?.name ?? "Document"}
                                                </Typography>
                                                <Typography className="text-[10px] text-gray-500 font-medium uppercase">
                                                    {doc.document_files?.length || 0} Files •{" "}
                                                    {doc.created_at
                                                        ? new Date(doc.created_at).toLocaleDateString()
                                                        : "—"}
                                                </Typography>
                                            </div>
                                            <StatusBadge status={reviewStatus} />
                                        </div>

                                        <div className="flex gap-2">
                                            <Link
                                                href={`/dashboard/document/student/${student?.id}/${doc.id}`}
                                                className="flex-1"
                                            >
                                                <Button
                                                    variant="outline"
                                                    className="w-full h-9 text-[11px] font-bold rounded-lg border-gray-200"
                                                >
                                                    View Files
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                )
                            })}

                            {documents.length === 0 && (
                                <div className="rounded-2xl bg-gray-50/50 py-10 text-center">
                                    <Typography className="text-xs text-gray-400 font-medium">
                                        No documents attached
                                    </Typography>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
})

export { ApplicationDetailView }
