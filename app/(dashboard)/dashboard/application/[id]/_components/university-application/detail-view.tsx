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
import { StatusBadge } from "@/components/shared/StatusBadge"
import { StudentProgressCard } from "@/app/(dashboard)/dashboard/student/[student-id]/_components/university-student/progress-card"
import { CreateOfferModal } from "@/app/(dashboard)/dashboard/all-application-view/_component/CreateOfferModal"
import { ApplicationReviewHistoryCard } from "@/app/(dashboard)/dashboard/application/_components/application-review-history-card"
import { RejectApplicationDialog } from "@/app/(dashboard)/dashboard/application/_components/reject-application-dialog"
import { applicationDetailCardClassName } from "@/app/(dashboard)/dashboard/application/_components/application-detail-card-styles"
import type { UniversityApplicationDetailLogicProps } from "./withUniversityApplicationDetailLogic"

function DocumentStatusIcon({
    status,
}: {
    status: NonNullable<UniversityApplicationDetailLogicProps["detail"]>["documents"][number]["status"]
}) {
    if (status === "verified") {
        return <CheckCircle2 className="size-4 text-brand-success" />
    }

    if (status === "action_required" || status === "missing") {
        return <AlertTriangle className="size-4 text-amber-500" />
    }

    return <FileText className="size-4 text-gray-400" />
}

function DetailField({
    label,
    value,
    subValue,
}: {
    label: string
    value: string
    subValue?: string | null
}) {
    return (
        <div className="space-y-1">
            <Typography as="p" className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </Typography>
            <Typography as="p" className="text-sm font-medium text-foreground">
                {value}
            </Typography>
            {subValue ? (
                <Typography as="p" className="text-xs font-normal text-muted-foreground">
                    {subValue}
                </Typography>
            ) : null}
        </div>
    )
}

export const UniversityApplicationDetailView = memo(function UniversityApplicationDetailView({
    detail,
    isLoading,
    isError,
    errorMessage,
    rejectDialogOpen,
    isReviewSubmitting,
    reviewErrorMessage,
    onRetry,
    onRejectRequest,
    onRejectDialogOpenChange,
    onRejectSubmit,
}: UniversityApplicationDetailLogicProps) {
    const [offerModalOpen, setOfferModalOpen] = useState(false)

    const handleOpenOfferModal = useCallback(() => {
        setOfferModalOpen(true)
    }, [])

    if (isLoading) {
        return <PageLoader />
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

    const canShowActions = detail.can_approve_for_signature || detail.can_reject

    return (
        <div className="mx-auto max-w-[1400px] space-y-6 px-4 pb-20 pt-4 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
                    <div className="space-y-1">
                        <Typography as="h1" className="text-lg font-semibold text-foreground">
                            Application Details
                        </Typography>
                        <div className="flex flex-wrap items-center gap-2">
                            {detail.display_id ? (
                                <Typography as="span" className="text-xs text-muted-foreground">
                                    ID: {detail.display_id}
                                </Typography>
                            ) : null}
                            <StatusBadge status={detail.application_status} />
                        </div>
                    </div>
                </div>

                {canShowActions ? (
                    <div className="flex flex-wrap items-center gap-2">
                        {detail.can_reject ? (
                            <Button
                                type="button"
                                variant="outline"
                                className="h-10 rounded-xl border-red-200 px-4 text-sm font-medium text-red-600 hover:bg-red-50"
                                onClick={onRejectRequest}
                            >
                                Reject
                            </Button>
                        ) : null}
                        {detail.can_approve_for_signature ? (
                            <Button
                                className="h-10 rounded-xl bg-brand-byzantine px-5 text-sm font-medium hover:bg-brand-byzantine/90"
                                onClick={handleOpenOfferModal}
                            >
                                Approve
                            </Button>
                        ) : null}
                    </div>
                ) : null}
            </div>

            <Card className={`px-5 py-5 ${applicationDetailCardClassName}`}>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                    <Image
                        src={avatarSrc}
                        alt={detail.student_name}
                        width={112}
                        height={112}
                        className="size-28 rounded-2xl object-cover"
                        unoptimized
                    />
                    <div className="flex-1 space-y-3">
                        <div>
                            <Typography as="h2" className="text-base font-semibold text-foreground">
                                {detail.student_name}
                            </Typography>
                            <Typography as="p" className="text-xs font-normal text-muted-foreground">
                                Student profile
                            </Typography>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                            {detail.email ? (
                                <div className="flex items-center gap-2">
                                    <Mail className="size-3.5 text-muted-foreground" />
                                    <Typography as="span" className="text-xs text-muted-foreground">
                                        {detail.email}
                                    </Typography>
                                </div>
                            ) : null}
                            {detail.location && detail.location !== "—" ? (
                                <div className="flex items-center gap-2">
                                    <MapPin className="size-3.5 text-muted-foreground" />
                                    <Typography as="span" className="text-xs text-muted-foreground">
                                        {detail.location}
                                    </Typography>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-6">
                    <Card className={`px-5 py-5 ${applicationDetailCardClassName}`}>
                        <Typography as="h3" className="mb-5 text-base font-semibold text-foreground">
                            Academic Record
                        </Typography>
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <DetailField
                                label="Previous Degree"
                                value={detail.academic_record.previous_degree ?? "—"}
                                subValue={detail.academic_record.institution_name ?? "—"}
                            />
                            <DetailField
                                label="Program Selection"
                                value={detail.academic_record.program_selection ?? "—"}
                                subValue={detail.academic_record.intake_label ?? "—"}
                            />
                            <DetailField
                                label="Final GPA"
                                value={detail.academic_record.gpa_label ?? "—"}
                                subValue={detail.academic_record.honors_label ?? "—"}
                            />
                            <DetailField
                                label="Tuition Status"
                                value={detail.academic_record.tuition_status ?? "—"}
                                subValue={detail.academic_record.tuition_total ?? "—"}
                            />
                        </div>
                    </Card>

                    <Card className={`px-5 py-5 ${applicationDetailCardClassName}`}>
                        <div className="mb-5 flex items-center justify-between gap-4">
                            <Typography as="h3" className="text-base font-semibold text-foreground">
                                Documents
                            </Typography>
                            {detail.documents_total_count > 0 ? (
                                <Typography
                                    as="span"
                                    className="rounded-full bg-brand-success/10 px-3 py-1 text-xs font-medium text-brand-success"
                                >
                                    {detail.documents_verified_count} / {detail.documents_total_count}{" "}
                                    Verified
                                </Typography>
                            ) : null}
                        </div>

                        <div className="space-y-4">
                            {detail.documents.length === 0 ? (
                                <Typography as="p" className="text-sm text-muted-foreground">
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
                                                <Typography
                                                    as="p"
                                                    className="text-sm font-medium text-foreground"
                                                >
                                                    {document.name}
                                                </Typography>
                                                {document.status_label ? (
                                                    <Typography
                                                        as="p"
                                                        className="text-xs font-normal text-muted-foreground"
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

                    <ApplicationReviewHistoryCard history={detail.review_history} />
                </div>

                <div className="space-y-6">
                    <StudentProgressCard
                        progress={detail.progress}
                        className={applicationDetailCardClassName}
                    />
                </div>
            </div>

            <CreateOfferModal
                open={offerModalOpen}
                onOpenChange={setOfferModalOpen}
                applicationId={detail.id}
                studentName={detail.student_name}
            />

            <RejectApplicationDialog
                open={rejectDialogOpen}
                studentName={detail.student_name}
                isSubmitting={isReviewSubmitting}
                errorMessage={reviewErrorMessage}
                onOpenChange={onRejectDialogOpenChange}
                onSubmit={onRejectSubmit}
            />
        </div>
    )
})
