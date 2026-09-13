"use client"

import { memo, useCallback } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { TableSkeleton } from "@/components/shared/table-skeleton"
import { StudentPipelineBadge } from "@/components/shared/student-pipeline-badge"
import { DocumentStudentSearch } from "@/app/(dashboard)/dashboard/document/_component/document-student-search"
import { DocumentRejectionIndicator } from "@/app/(dashboard)/dashboard/document/_component/document-rejection-indicator"
import { Spinner } from "@/components/shared/page-loader"
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type {
    UniversityApplicationListItem,
    UniversityApplicationTab,
} from "@/types/schemas/university-application"
import type { DocumentRejectionHistoryEntry } from "@/types/schemas/document"

/** Rejection + Student + Program + Intake + Partner + Status + Submitted + Approval */
const COLUMN_COUNT = 8

function toRejectionIndicatorHistory(
    history: UniversityApplicationListItem["rejection_history"]
): DocumentRejectionHistoryEntry[] {
    return history
        .filter((entry) => Boolean(entry.feedback?.trim()))
        .map((entry) => ({
            feedback: entry.feedback!.trim(),
            created_at: entry.created_at,
        }))
}

type UniversityApplicationListTableProps = {
    applications: UniversityApplicationListItem[]
    tabCounts: {
        all: number
        pending_review: number
        awaiting_signature: number
        recently_completed: number
        rejected: number
    }
    pagination?: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
    isFetching?: boolean
    searchValue: string
    activeTab: UniversityApplicationTab
    onSearchChange: (value: string) => void
    onTabChange: (value: UniversityApplicationTab) => void
    onTabHover: (value: UniversityApplicationTab) => void
    onPageChange: (page: number) => void
    reviewingApplicationId?: string | null
    onApprove?: (application: UniversityApplicationListItem) => void
    onRejectRequest?: (application: UniversityApplicationListItem) => void
}

const tabs: {
    key: UniversityApplicationTab
    label: string
    countKey: keyof UniversityApplicationListTableProps["tabCounts"]
}[] = [
    { key: "all", label: "All Applications", countKey: "all" },
    { key: "pending-review", label: "Pending Review", countKey: "pending_review" },
    { key: "awaiting-signature", label: "Awaiting Signature", countKey: "awaiting_signature" },
    { key: "recently-completed", label: "Recently Completed", countKey: "recently_completed" },
    { key: "rejected", label: "Rejected", countKey: "rejected" },
]

export const UniversityApplicationListTable = memo(function UniversityApplicationListTable({
    applications,
    tabCounts,
    pagination,
    isFetching = false,
    searchValue,
    activeTab,
    onSearchChange,
    onTabChange,
    onTabHover,
    onPageChange,
    reviewingApplicationId = null,
    onApprove,
    onRejectRequest,
}: UniversityApplicationListTableProps) {
    const router = useRouter()
    const showingCount = applications.length
    const totalCount = pagination?.total ?? showingCount
    const page = pagination?.page ?? 1
    const totalPages = Math.max(1, pagination?.totalPages ?? 1)

    const openApplication = useCallback(
        (applicationId: string) => {
            router.push(`/dashboard/application/${applicationId}`)
        },
        [router]
    )

    return (
        <div className="space-y-5">
            <div className="max-w-xl">
                <DocumentStudentSearch value={searchValue} onChange={onSearchChange} />
            </div>

            <div className="flex flex-wrap items-center gap-2 border-b border-brand-secondary/20 pb-0">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.key
                    const count = tabCounts[tab.countKey]

                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => onTabChange(tab.key)}
                            onMouseEnter={() => onTabHover(tab.key)}
                            onFocus={() => onTabHover(tab.key)}
                            className={
                                isActive
                                    ? "relative -mb-px cursor-pointer rounded-t-lg border border-brand-secondary/25 border-b-white bg-brand-secondary/10 px-4 pb-3 pt-2 text-sm font-semibold text-brand-blue-text transition-colors"
                                    : "relative -mb-px cursor-pointer border-b-2 border-transparent px-4 pb-3 pt-2 text-sm font-medium text-gray-500 transition-colors hover:text-brand-blue-text/80"
                            }
                        >
                            <Typography
                                as="span"
                                className={
                                    isActive
                                        ? "text-sm font-semibold text-brand-blue-text"
                                        : "text-sm font-medium text-gray-500"
                                }
                            >
                                {tab.label}
                            </Typography>
                            {tab.key !== "recently-completed" ? (
                                <Typography
                                    as="span"
                                    font="small"
                                    className={
                                        isActive
                                            ? "ml-2 inline-flex size-6 items-center justify-center rounded-full bg-brand-secondary/25 text-[10px] font-bold text-brand-blue-text"
                                            : "ml-2 inline-flex size-6 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-600"
                                    }
                                >
                                    {count.toLocaleString()}
                                </Typography>
                            ) : null}
                        </button>
                    )
                })}
            </div>

            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                blendColorClass="bg-white/10"
                childClass="p-0!"
                className="rounded-lg p-0"
            >
                {isFetching ? (
                    <TableSkeleton columns={COLUMN_COUNT} rows={6} showFooter />
                ) : (
                    <div className="relative overflow-x-auto rounded-xl">
                        <Table className="w-full min-w-[1080px] text-left border-collapse">
                            <TableHeader className="sticky top-0 z-10">
                                <TableRow className="border-b-2 border-brand-secondary/20 bg-brand-secondary/10 hover:bg-brand-secondary/10">
                                    <TableHead className="w-12 px-3" aria-hidden />
                                    <TableHead className="px-3 py-3 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                        Student
                                    </TableHead>
                                    <TableHead className="max-w-[220px] px-3 py-3 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                        Program
                                    </TableHead>
                                    <TableHead className="px-3 py-3 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                        Intake
                                    </TableHead>
                                    <TableHead className="px-3 py-3 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                        University Partner
                                    </TableHead>
                                    <TableHead className="px-3 py-3 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                        Status
                                    </TableHead>
                                    <TableHead className="px-3 py-3 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                        Submitted
                                    </TableHead>
                                    <TableHead className="min-w-[168px] px-3 py-3 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                        Approval
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="bg-white/45">
                                {applications.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={COLUMN_COUNT}
                                            className="px-8 py-16 text-center"
                                        >
                                            <Typography
                                                as="p"
                                                className="text-sm text-gray-500 font-medium"
                                            >
                                                No applications found.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    applications.map((application, index) => {
                                        const avatarSrc =
                                            application.avatar_url ??
                                            `https://ui-avatars.com/api/?name=${encodeURIComponent(application.student_name)}&background=random`
                                        const rejectionHistory = toRejectionIndicatorHistory(
                                            application.rejection_history
                                        )
                                        const showRejectionIndicator = rejectionHistory.length > 0
                                        const isReviewing =
                                            reviewingApplicationId === application.id
                                        const canApprove = Boolean(
                                            application.can_approve_for_signature
                                        )
                                        const canReject = Boolean(application.can_reject)
                                        const canShowApproval = canApprove || canReject
                                        const rowBg =
                                            index % 2 === 0 ? "bg-white/70" : "bg-white/45"

                                        return (
                                            <TableRow
                                                key={application.id}
                                                role="link"
                                                tabIndex={0}
                                                onClick={() => openApplication(application.id)}
                                                onKeyDown={(event) => {
                                                    if (event.key !== "Enter" && event.key !== " ") {
                                                        return
                                                    }
                                                    event.preventDefault()
                                                    openApplication(application.id)
                                                }}
                                                className={cn(
                                                    "border-b border-brand-secondary/40 transition-colors cursor-pointer",
                                                    rowBg,
                                                    "hover:bg-brand-secondary/5",
                                                    isReviewing && "opacity-70"
                                                )}
                                            >
                                                <TableCell className="px-3 py-3 whitespace-nowrap">
                                                    {showRejectionIndicator ? (
                                                        <DocumentRejectionIndicator
                                                            history={rejectionHistory}
                                                            placement="bottom-right"
                                                        />
                                                    ) : null}
                                                </TableCell>
                                                <TableCell className="px-3 py-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <Image
                                                            src={avatarSrc}
                                                            alt={application.student_name}
                                                            width={40}
                                                            height={40}
                                                            className="size-10 rounded-xl border-2 border-white/50 object-cover"
                                                            unoptimized
                                                        />
                                                        <div className="flex flex-col">
                                                            <Typography
                                                                as="span"
                                                                className="text-sm font-bold text-gray-900"
                                                            >
                                                                {application.student_name}
                                                            </Typography>
                                                            <Typography
                                                                as="span"
                                                                className="text-xs font-normal text-muted-foreground"
                                                            >
                                                                ID:{" "}
                                                                {application.student_code ?? "N/A"}
                                                            </Typography>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-[220px] px-3 py-3">
                                                    <Typography
                                                        as="span"
                                                        className="block truncate text-sm font-bold text-gray-700"
                                                        title={application.course_name ?? undefined}
                                                    >
                                                        {application.course_name ?? "—"}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell className="px-3 py-3 whitespace-nowrap">
                                                    <Typography
                                                        as="span"
                                                        className="text-sm font-medium text-gray-700"
                                                    >
                                                        {application.intake_label ?? "—"}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell className="px-3 py-3 whitespace-nowrap">
                                                    <Typography
                                                        as="span"
                                                        className="text-sm font-light text-gray-600"
                                                    >
                                                        {application.agent_name || "—"}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell className="px-3 py-3 whitespace-nowrap">
                                                    <StudentPipelineBadge
                                                        status={application.pipeline_status}
                                                    />
                                                </TableCell>
                                                <TableCell className="px-3 py-3 whitespace-nowrap">
                                                    <Typography
                                                        as="span"
                                                        className="text-sm font-medium text-gray-600"
                                                    >
                                                        {application.submission_date ?? "—"}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell
                                                    className="min-w-[168px] px-3 py-3 whitespace-nowrap"
                                                    onClick={(event) => event.stopPropagation()}
                                                    onKeyDown={(event) => event.stopPropagation()}
                                                >
                                                    {canShowApproval ? (
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            {canReject ? (
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    className="h-9 rounded-lg border-red-200 px-3 text-[12px] font-bold text-red-600 hover:bg-red-50"
                                                                    disabled={isReviewing}
                                                                    onClick={() =>
                                                                        onRejectRequest?.(
                                                                            application
                                                                        )
                                                                    }
                                                                >
                                                                    Reject
                                                                </Button>
                                                            ) : null}
                                                            {canApprove ? (
                                                                <Button
                                                                    type="button"
                                                                    className="h-9 gap-1.5 rounded-lg bg-brand-byzantine px-3 text-[12px] font-bold hover:bg-brand-byzantine/90"
                                                                    disabled={isReviewing}
                                                                    onClick={() =>
                                                                        onApprove?.(application)
                                                                    }
                                                                >
                                                                    {isReviewing ? (
                                                                        <>
                                                                            <Spinner size="sm" />
                                                                            Working...
                                                                        </>
                                                                    ) : (
                                                                        "Approve"
                                                                    )}
                                                                </Button>
                                                            ) : null}
                                                        </div>
                                                    ) : (
                                                        <Typography
                                                            as="span"
                                                            className="text-sm text-muted-foreground"
                                                        >
                                                            —
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                            <TableFooter className="border-t-2 border-brand-secondary/20 bg-brand-secondary/10 hover:bg-brand-secondary/10">
                                <TableRow className="hover:bg-brand-secondary/10 border-0">
                                    <TableCell colSpan={COLUMN_COUNT} className="px-4 py-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex flex-wrap items-center gap-x-1 text-[12px] font-light text-gray-500">
                                                <Typography
                                                    as="span"
                                                    className="text-[12px] font-light text-gray-500"
                                                >
                                                    Showing
                                                </Typography>
                                                <Typography
                                                    as="span"
                                                    className="text-[12px] font-bold text-brand-blue-text"
                                                >
                                                    {showingCount}
                                                </Typography>
                                                <Typography
                                                    as="span"
                                                    className="text-[12px] font-light text-gray-500"
                                                >
                                                    of
                                                </Typography>
                                                <Typography
                                                    as="span"
                                                    className="text-[12px] font-bold text-brand-blue-text"
                                                >
                                                    {totalCount.toLocaleString()}
                                                </Typography>
                                                <Typography
                                                    as="span"
                                                    className="text-[12px] font-light text-gray-500"
                                                >
                                                    total
                                                </Typography>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() =>
                                                        pagination &&
                                                        onPageChange(Math.max(1, page - 1))
                                                    }
                                                    disabled={!pagination || page <= 1}
                                                >
                                                    <ChevronLeft size={16} />
                                                </Button>
                                                <Typography
                                                    as="span"
                                                    className="min-w-[72px] text-center text-[12px] font-medium text-gray-600"
                                                >
                                                    {`${page} / ${totalPages}`}
                                                </Typography>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() =>
                                                        pagination &&
                                                        onPageChange(
                                                            Math.min(totalPages, page + 1)
                                                        )
                                                    }
                                                    disabled={
                                                        !pagination || page >= totalPages
                                                    }
                                                >
                                                    <ChevronRight size={16} />
                                                </Button>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                )}
            </BluryCard>
        </div>
    )
})
