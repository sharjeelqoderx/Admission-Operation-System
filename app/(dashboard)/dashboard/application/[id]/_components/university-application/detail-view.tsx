"use client"

import { memo, useCallback, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
    AlertTriangle,
    CheckCircle2,
    ChevronLeft,
    FileText,
    Mail,
    MapPin,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Typography } from "@/components/shared/Typography"
import { ErrorView } from "@/components/shared/error-view"
import { PageLoader } from "@/components/shared/page-loader"
import { StudentProgressCard } from "@/app/(dashboard)/dashboard/student/[student-id]/_components/university-student/progress-card"
import { useAuth } from "@/hooks/useAuth"
import { isUniversityViewOnly } from "@/lib/auth/is-university-view-only"
import { CreateOfferModal } from "@/app/(dashboard)/dashboard/all-application-view/_component/CreateOfferModal"
import type { UniversityApplicationDetailLogicProps } from "./withUniversityApplicationDetailLogic"

function DocumentStatusIcon({
    status,
}: {
    status: NonNullable<UniversityApplicationDetailLogicProps["detail"]>["documents"][number]["status"]
}) {
    if (status === "verified") {
        return <CheckCircle2 className="size-5 text-brand-success" />
    }

    if (status === "action_required" || status === "missing") {
        return <AlertTriangle className="size-5 text-amber-500" />
    }

    return <FileText className="size-5 text-gray-400" />
}

export const UniversityApplicationDetailView = memo(function UniversityApplicationDetailView({
    detail,
    isLoading,
    isError,
    errorMessage,
    onRetry,
}: UniversityApplicationDetailLogicProps) {
    const [offerModalOpen, setOfferModalOpen] = useState(false)
    const { me } = useAuth()
    const viewOnly = isUniversityViewOnly(me.data?.role)
    const canShowApproveButton =
        detail?.can_approve_for_signature && !viewOnly && me.isSuccess

    if (isLoading) {
        return <PageLoader label="Loading application details..." />
    }

    if (isError || !detail) {
        return (
            <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-center gap-4 px-4 py-40 lg:px-8">
                <ErrorView message={errorMessage} />
                <div className="flex gap-3">
                    <Link href="/dashboard/application">
                        <Button variant="outline">Back to Applications</Button>
                    </Link>
                    <Button onClick={onRetry}>Retry</Button>
                </div>
            </div>
        )
    }

    const avatarSrc =
        detail.avatar_url ??
        `https://ui-avatars.com/api/?name=${encodeURIComponent(detail.student_name)}&background=random`

    const handleOpenOfferModal = useCallback(() => {
        setOfferModalOpen(true)
    }, [])

    return (
        <div className="mx-auto max-w-[1400px] space-y-8 px-4 pb-20 pt-4 lg:px-8">
            <div className="flex items-center gap-3">
                <Link href="/dashboard/application">
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-9 shrink-0 rounded-full sm:size-10"
                    >
                        <ChevronLeft className="size-5" />
                    </Button>
                </Link>
                <Typography as="span" font="sub-text" className="font-medium text-gray-500">
                    Back to Applications
                </Typography>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                    <Typography as="h1" font="text-xl" className="font-bold text-brand-primary">
                        {detail.student_name}
                    </Typography>
                    <div className="flex flex-wrap items-center gap-4">
                        {detail.email ? (
                            <div className="flex items-center gap-2">
                                <Mail className="size-4 text-gray-500" />
                                <Typography as="span" font="sub-text" className="text-gray-500">
                                    {detail.email}
                                </Typography>
                            </div>
                        ) : null}
                        {detail.location && detail.location !== "—" ? (
                            <div className="flex items-center gap-2">
                                <MapPin className="size-4 text-gray-500" />
                                <Typography as="span" font="sub-text" className="text-gray-500">
                                    {detail.location}
                                </Typography>
                            </div>
                        ) : null}
                    </div>
                </div>

                {canShowApproveButton ? (
                    <Button
                        className="h-11 rounded-xl bg-brand-byzantine px-6 font-semibold hover:bg-brand-byzantine/90"
                        onClick={handleOpenOfferModal}
                    >
                        Approve for Signature
                    </Button>
                ) : null}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-6">
                    <Card className="border-none bg-white/80 px-5 py-6 shadow-sm ring-1 ring-black/5 backdrop-blur-lg">
                        <div className="flex flex-col gap-6 lg:flex-row">
                            <Image
                                src={avatarSrc}
                                alt={detail.student_name}
                                width={160}
                                height={160}
                                className="size-40 rounded-[28px] border-4 border-white object-cover shadow-xl"
                                unoptimized
                            />
                            <div className="flex-1 space-y-6">
                                <Typography as="h3" font="title" className="font-bold text-brand-primary">
                                    Academic Record
                                </Typography>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="space-y-1">
                                        <Typography as="p" font="small" className="uppercase tracking-widest text-gray-400">
                                            Previous Degree
                                        </Typography>
                                        <Typography as="p" font="title" className="text-brand-primary">
                                            {detail.academic_record.previous_degree ?? "—"}
                                        </Typography>
                                        <Typography as="p" font="sub-text" className="text-gray-500">
                                            {detail.academic_record.institution_name ?? "—"}
                                        </Typography>
                                    </div>
                                    <div className="space-y-1">
                                        <Typography as="p" font="small" className="uppercase tracking-widest text-gray-400">
                                            Program Selection
                                        </Typography>
                                        <Typography as="p" font="title" className="text-brand-blue">
                                            {detail.academic_record.program_selection ?? "—"}
                                        </Typography>
                                        <Typography as="p" font="sub-text" className="text-brand-blue">
                                            {detail.academic_record.intake_label ?? "—"}
                                        </Typography>
                                    </div>
                                    <div className="space-y-1">
                                        <Typography as="p" font="small" className="uppercase tracking-widest text-gray-400">
                                            Final GPA
                                        </Typography>
                                        <Typography as="p" font="title" className="text-brand-primary">
                                            {detail.academic_record.gpa_label ?? "—"}
                                        </Typography>
                                        <Typography as="p" font="sub-text" className="text-gray-500">
                                            {detail.academic_record.honors_label ?? "—"}
                                        </Typography>
                                    </div>
                                    <div className="space-y-1">
                                        <Typography as="p" font="small" className="uppercase tracking-widest text-gray-400">
                                            Tuition Status
                                        </Typography>
                                        <Typography as="p" font="title" className="text-brand-primary">
                                            {detail.academic_record.tuition_status ?? "—"}
                                        </Typography>
                                        <Typography as="p" font="sub-text" className="text-gray-500">
                                            {detail.academic_record.tuition_total ?? "—"}
                                        </Typography>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="border-none bg-white/80 px-5 py-6 shadow-sm ring-1 ring-black/5 backdrop-blur-lg">
                        <div className="mb-6 flex items-center justify-between gap-4">
                            <Typography as="h3" font="title" className="font-bold text-brand-primary">
                                Document
                            </Typography>
                            {detail.documents_total_count > 0 ? (
                                <Typography
                                    as="span"
                                    font="small"
                                    className="rounded-full bg-brand-success/10 px-3 py-1 font-bold text-brand-success"
                                >
                                    {detail.documents_verified_count} / {detail.documents_total_count} Verified
                                </Typography>
                            ) : null}
                        </div>

                        <div className="space-y-4">
                            {detail.documents.length === 0 ? (
                                <Typography as="p" font="sub-text" className="text-gray-500">
                                    No documents attached to this application.
                                </Typography>
                            ) : (
                                detail.documents.map((document) => (
                                    <div
                                        key={document.id}
                                        className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                                    >
                                        <div className="flex items-start gap-3">
                                            <DocumentStatusIcon status={document.status} />
                                            <div className="space-y-1">
                                                <Typography as="p" font="text" className="font-semibold text-brand-primary">
                                                    {document.name}
                                                </Typography>
                                                {document.status_label ? (
                                                    <Typography
                                                        as="p"
                                                        font="small"
                                                        className="font-bold uppercase tracking-wide text-amber-600"
                                                    >
                                                        {document.status_label}
                                                    </Typography>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <StudentProgressCard progress={detail.progress} />


                </div>
            </div>

            {!viewOnly ? (
                <CreateOfferModal
                    open={offerModalOpen}
                    onOpenChange={setOfferModalOpen}
                    applicationId={detail.id}
                    studentName={detail.student_name}
                />
            ) : null}
        </div>
    )
})
