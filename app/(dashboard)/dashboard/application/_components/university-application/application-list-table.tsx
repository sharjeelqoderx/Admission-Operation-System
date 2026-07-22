"use client"

import { memo } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Typography } from "@/components/shared/Typography"
import { PageLoader } from "@/components/shared/page-loader"
import { StudentPipelineBadge } from "@/components/shared/student-pipeline-badge"
import { DocumentStudentSearch } from "@/app/(dashboard)/dashboard/document/_component/document-student-search"
import { DocumentRejectionIndicator } from "@/app/(dashboard)/dashboard/document/_component/document-rejection-indicator"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import type {
    UniversityApplicationListItem,
    UniversityApplicationTab,
} from "@/types/schemas/university-application"
import type { DocumentRejectionHistoryEntry } from "@/types/schemas/document"

const COLUMN_COUNT = 6

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
}

const tabs: { key: UniversityApplicationTab; label: string; countKey: keyof UniversityApplicationListTableProps["tabCounts"] }[] = [
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
}: UniversityApplicationListTableProps) {
    const showingCount = applications.length
    const totalCount = pagination?.total ?? showingCount

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
                            <span>{tab.label}</span>
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

            <Card className="relative overflow-hidden border-none bg-white shadow-sm ring-1 ring-black/5">
                {isFetching ? (
                    <PageLoader className="py-24" />
                ) : (
                    <>
                <div className="overflow-x-auto">
                    <Table className="min-w-[1100px]">
                        <TableHeader>
                            <TableRow className="border-b border-gray-100 hover:bg-transparent">
                                <TableHead className="w-12 px-3" aria-hidden />
                                {[
                                    "Student Name",
                                    "Program",
                                    "Status",
                                    "Submission Date",
                                    "Action",
                                ].map((heading) => (
                                    <TableHead
                                        key={heading}
                                        className={
                                            heading === "Program"
                                                ? "px-6 py-5 max-w-[240px]"
                                                : "px-6 py-5"
                                        }
                                    >
                                        <Typography
                                            as="span"
                                            font="small"
                                            className="uppercase tracking-[0.12em] text-gray-500"
                                        >
                                            {heading}
                                        </Typography>
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {applications.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={COLUMN_COUNT} className="px-6 py-12 text-center">
                                        <Typography as="span" font="sub-text" className="text-gray-500">
                                            No applications found.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                applications.map((application) => {
                                    const avatarSrc =
                                        application.avatar_url ??
                                        `https://ui-avatars.com/api/?name=${encodeURIComponent(application.student_name)}&background=random`
                                    const rejectionHistory = toRejectionIndicatorHistory(
                                        application.rejection_history
                                    )
                                    const showRejectionIndicator = rejectionHistory.length > 0

                                    return (
                                        <TableRow key={application.id} className="border-b border-gray-50">
                                            <TableCell className="px-3 py-5 whitespace-nowrap">
                                                {showRejectionIndicator ? (
                                                    <DocumentRejectionIndicator
                                                        history={rejectionHistory}
                                                        placement="bottom-right"
                                                    />
                                                ) : null}
                                            </TableCell>
                                            <TableCell className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <Image
                                                        src={avatarSrc}
                                                        alt={application.student_name}
                                                        width={40}
                                                        height={40}
                                                        className="size-10 rounded-xl border-2 border-white/50 object-cover"
                                                        unoptimized
                                                    />
                                                    <div>
                                                        <Typography
                                                            as="p"
                                                            font="text"
                                                            className="font-semibold text-gray-900"
                                                        >
                                                            {application.student_name}
                                                        </Typography>
                                                        <Typography
                                                            as="p"
                                                            className="text-xs font-normal text-muted-foreground"
                                                        >
                                                            ID: {application.student_code ?? "N/A"}
                                                        </Typography>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[240px] px-6 py-5">
                                                <div className="min-w-0 max-w-[240px]">
                                                    <Typography
                                                        as="p"
                                                        font="text"
                                                        className="truncate font-semibold text-brand-primary"
                                                        title={application.program_name ?? undefined}
                                                    >
                                                        {application.program_name ?? "—"}
                                                    </Typography>
                                                    <Typography
                                                        as="p"
                                                        className="truncate text-xs font-normal text-muted-foreground"
                                                        title={application.intake_label ?? undefined}
                                                    >
                                                        {application.intake_label ?? "—"}
                                                    </Typography>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-5">
                                                <StudentPipelineBadge status={application.pipeline_status} />
                                            </TableCell>
                                            <TableCell className="px-6 py-5">
                                                <Typography as="span" font="sub-text" className="text-gray-600">
                                                    {application.submission_date ?? "—"}
                                                </Typography>
                                            </TableCell>
                                            <TableCell className="px-6 py-5 whitespace-nowrap">
                                                <Button
                                                    variant="outline"
                                                    className="h-9 px-6 bg-white/20 border-white/40 text-gray-700 hover:bg-white/40 rounded-lg font-bold text-[12px] transition-all shadow-sm"
                                                    asChild
                                                >
                                                    <Link href={`/dashboard/application/${application.id}`}>
                                                        View
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
                    <Typography as="span" font="sub-text" className="text-gray-500">
                        Showing {showingCount} of {totalCount.toLocaleString()} entries
                    </Typography>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={!pagination || pagination.page <= 1}
                            onClick={() => pagination && onPageChange(pagination.page - 1)}
                            className="flex size-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40"
                        >
                            <ChevronLeft className="size-4" />
                        </button>
                        <button
                            type="button"
                            disabled={!pagination || pagination.page >= pagination.totalPages}
                            onClick={() => pagination && onPageChange(pagination.page + 1)}
                            className="flex size-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40"
                        >
                            <ChevronRight className="size-4" />
                        </button>
                    </div>
                </div>
                    </>
                )}
            </Card>
        </div>
    )
})
