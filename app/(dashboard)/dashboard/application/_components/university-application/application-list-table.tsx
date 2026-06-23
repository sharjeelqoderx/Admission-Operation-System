"use client"

import { memo } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Typography } from "@/components/shared/Typography"
import { StudentPipelineBadge } from "@/components/shared/student-pipeline-badge"
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

type UniversityApplicationListTableProps = {
    applications: UniversityApplicationListItem[]
    tabCounts: {
        all: number
        pending_review: number
        awaiting_signature: number
        recently_completed: number
    }
    pagination?: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
    isLoading?: boolean
    searchValue: string
    activeTab: UniversityApplicationTab
    onSearchChange: (value: string) => void
    onTabChange: (value: UniversityApplicationTab) => void
    onPageChange: (page: number) => void
}

const tabs: { key: UniversityApplicationTab; label: string; countKey: keyof UniversityApplicationListTableProps["tabCounts"] }[] = [
    { key: "all", label: "All Applications", countKey: "all" },
    { key: "pending-review", label: "Pending Review", countKey: "pending_review" },
    { key: "awaiting-signature", label: "Awaiting Signature", countKey: "awaiting_signature" },
    { key: "recently-completed", label: "Recently Completed", countKey: "recently_completed" },
]

export const UniversityApplicationListTable = memo(function UniversityApplicationListTable({
    applications,
    tabCounts,
    pagination,
    isLoading = false,
    searchValue,
    activeTab,
    onSearchChange,
    onTabChange,
    onPageChange,
}: UniversityApplicationListTableProps) {
    const showingCount = applications.length
    const totalCount = pagination?.total ?? showingCount

    return (
        <div className="space-y-5">
            <div className="relative max-w-xl">
                <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <Input
                    value={searchValue}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder="Search student, program, or university partner"
                    className="h-12 border-none bg-white pl-11 shadow-sm ring-1 ring-black/5"
                />
            </div>

            <div className="flex flex-wrap items-center gap-6 border-b border-gray-200">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.key
                    const count = tabCounts[tab.countKey]

                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => onTabChange(tab.key)}
                            className={
                                isActive
                                    ? "border-b-2 border-brand-blue pb-3 text-sm font-semibold text-brand-blue"
                                    : "pb-3 text-sm font-medium text-gray-500"
                            }
                        >
                            <span>{tab.label}</span>
                            {tab.key !== "recently-completed" ? (
                                <Typography
                                    as="span"
                                    font="small"
                                    className="ml-2 inline-flex size-6 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-600"
                                >
                                    {count.toLocaleString()}
                                </Typography>
                            ) : null}
                        </button>
                    )
                })}
            </div>

            <Card className="overflow-hidden border-none bg-white shadow-sm ring-1 ring-black/5">
                <div className="overflow-x-auto">
                    <Table className="min-w-[1100px]">
                        <TableHeader>
                            <TableRow className="border-b border-gray-100 hover:bg-transparent">
                                {[
                                    "Student Name",
                                    "Program",
                                    "University Partner Name",
                                    "Status",
                                    "Submission Date",
                                    "Action",
                                ].map((heading) => (
                                    <TableHead key={heading} className="px-6 py-5">
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
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="px-6 py-12 text-center">
                                        <Typography as="span" font="sub-text" className="text-gray-500">
                                            Loading applications...
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : applications.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="px-6 py-12 text-center">
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

                                    return (
                                        <TableRow key={application.id} className="border-b border-gray-50">
                                            <TableCell className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <Image
                                                        src={avatarSrc}
                                                        alt={application.student_name}
                                                        width={40}
                                                        height={40}
                                                        className="size-10 rounded-full object-cover"
                                                        unoptimized
                                                    />
                                                    <div>
                                                        <Typography
                                                            as="p"
                                                            font="text"
                                                            className="font-semibold text-brand-blue"
                                                        >
                                                            {application.student_name}
                                                        </Typography>
                                                        <Typography as="p" font="sub-text" className="text-gray-500">
                                                            ID: {application.student_code ?? "N/A"}
                                                        </Typography>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-5">
                                                <Typography as="p" font="text" className="font-semibold text-brand-primary">
                                                    {application.program_name ?? "—"}
                                                </Typography>
                                                <Typography as="p" font="sub-text" className="text-gray-500">
                                                    {application.intake_label ?? "—"}
                                                </Typography>
                                            </TableCell>
                                            <TableCell className="px-6 py-5">
                                                <Typography as="span" font="sub-text" className="text-gray-700">
                                                    {application.agent_name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell className="px-6 py-5">
                                                <StudentPipelineBadge status={application.pipeline_status} />
                                            </TableCell>
                                            <TableCell className="px-6 py-5">
                                                <Typography as="span" font="sub-text" className="text-gray-600">
                                                    {application.submission_date ?? "—"}
                                                </Typography>
                                            </TableCell>
                                            <TableCell className="px-6 py-5">
                                                <Link
                                                    href={`/dashboard/application/${application.id}`}
                                                    className="font-bold uppercase tracking-wide text-brand-blue"
                                                >
                                                    View
                                                </Link>
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
            </Card>
        </div>
    )
})
