"use client"

import { memo } from "react"
import Link from "next/link"
import { Eye, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Typography } from "@/components/shared/Typography"
import { StudentPipelineBadge } from "@/components/shared/student-pipeline-badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import type { UniversityStudentListItem } from "@/types/schemas/university-student"

type UniversityStudentListTableProps = {
    students: UniversityStudentListItem[]
    pagination?: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
    isLoading?: boolean
    searchValue: string
    statusValue: string
    activeTab: string
    onSearchChange: (value: string) => void
    onStatusChange: (value: string) => void
    onTabChange: (value: string) => void
    onPageChange: (page: number) => void
}

const tabs = ["All Students", "Program", "Applied", "Submission Date"]

export const UniversityStudentListTable = memo(function UniversityStudentListTable({
    students,
    pagination,
    isLoading = false,
    searchValue,
    statusValue,
    activeTab,
    onSearchChange,
    onStatusChange,
    onTabChange,
    onPageChange,
}: UniversityStudentListTableProps) {
    const showingCount = students.length
    const totalCount = pagination?.total ?? showingCount

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        value={searchValue}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder="Student name and Program"
                        className="h-12 border-none bg-white pl-11 shadow-sm ring-1 ring-black/5"
                    />
                </div>
                <Select value={statusValue} onValueChange={onStatusChange}>
                    <SelectTrigger className="h-12 w-full border-none bg-white shadow-sm ring-1 ring-black/5 lg:w-56">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="created">Created</SelectItem>
                        <SelectItem value="contract-sent">Contract Sent</SelectItem>
                        <SelectItem value="signed">Signed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab

                    return (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => onTabChange(tab)}
                            className={
                                isActive
                                    ? "rounded-full bg-brand-secondary px-5 py-2 text-xs font-semibold text-white"
                                    : "rounded-full bg-[#8ba4d5]/35 px-5 py-2 text-xs font-semibold text-brand-primary"
                            }
                        >
                            {tab}
                        </button>
                    )
                })}
            </div>

            <Card className="overflow-hidden border-none bg-white shadow-sm ring-1 ring-black/5">
                <div className="overflow-x-auto">
                    <Table className="min-w-[980px]">
                        <TableHeader>
                            <TableRow className="border-b border-gray-100 hover:bg-transparent">
                                {[
                                    "Student Name",
                                    "Program",
                                    "Applied Through",
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
                                            Loading students...
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : students.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="px-6 py-12 text-center">
                                        <Typography as="span" font="sub-text" className="text-gray-500">
                                            No students found.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                students.map((student) => (
                                    <TableRow key={student.profile_id} className="border-b border-gray-50">
                                        <TableCell className="px-6 py-5">
                                            <Typography as="p" font="text" className="font-semibold text-brand-primary">
                                                {student.name}
                                            </Typography>
                                            <Typography as="p" font="sub-text" className="text-gray-500">
                                                ID: {student.student_code ?? "N/A"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell className="px-6 py-5">
                                            <Typography as="p" font="text" className="font-semibold text-brand-primary">
                                                {student.program_name ?? "—"}
                                            </Typography>
                                            <Typography as="p" font="sub-text" className="text-gray-500">
                                                {student.intake_label ?? "—"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell className="px-6 py-5">
                                            <Typography as="span" font="sub-text" className="text-gray-700">
                                                {student.applied_through}
                                            </Typography>
                                        </TableCell>
                                        <TableCell className="px-6 py-5">
                                            <StudentPipelineBadge status={student.pipeline_status} />
                                        </TableCell>
                                        <TableCell className="px-6 py-5">
                                            <Typography as="span" font="sub-text" className="text-gray-600">
                                                {student.submission_date ?? "—"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell className="px-6 py-5">
                                            <Link
                                                href={`/dashboard/student/${student.profile_id}`}
                                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-byzantine hover:text-brand-blue"
                                            >
                                                <Eye className="size-4" />
                                                View
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
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
