"use client"

import { Typography } from "@/components/shared/Typography"
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Eye,
    Pencil,
    Trash2,
    AlertCircle
} from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

// shadcn table imports
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table"
import { BluryCard } from "@/components/shared/blury-card"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { PageLoader } from "@/components/shared/page-loader"

type Student = any

type Props = {
    students: Student[]
    isLoading: boolean
    isError: boolean
    errorMessage?: string
    deletingId: string | null
    pagination?: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
    onDelete: (id: string, name: string) => void
    onRetry: () => void
    onPageChange: (page: number) => void
}

export function StudentTable({
    students,
    isLoading,
    isError,
    errorMessage,
    deletingId,
    pagination,
    onDelete,
    onRetry,
    onPageChange,
}: Props) {
    if (isLoading) {
        return <PageLoader label="Fetching students..." />
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="size-16 rounded-2xl bg-red-50 flex items-center justify-center">
                    <AlertCircle className="size-8 text-red-400" />
                </div>

                <div className="text-center px-4">
                    <Typography as="p" className="text-sm font-bold text-gray-700">
                        {errorMessage || "Failed to load students"}
                    </Typography>
                    <Typography as="p" className="text-xs text-gray-500 mt-1">
                        Try refreshing the page or contact support if the issue persists.
                    </Typography>
                </div>

                <button
                    onClick={onRetry}
                    className="px-8 py-2.5 rounded-xl text-sm font-semibold bg-brand-byzantine text-white hover:bg-brand-byzantine/90 transition-all shadow-lg shadow-brand-byzantine/20"
                >
                    Retry Now
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-4 pt-4">
            {/* Table */}

            {/* Table */}
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                blendColorClass="bg-white/10"
                childClass='p-0!'
                className='rounded-lg p-0'
            >
                <div className="overflow-x-auto">
                    <Table className="w-full text-left border-collapse min-w-[900px]">
                        <TableHeader>
                            <TableRow className="border-b border-white/20 bg-white/30 hover:bg-white/30">
                                <TableHead className="px-6 py-5 text-[10px] font-extrabold uppercase">Student Name</TableHead>
                                <TableHead className="px-6 py-5 text-[10px] font-extrabold uppercase">Student ID</TableHead>
                                <TableHead className="px-6 py-5 text-[10px] font-extrabold uppercase">Country</TableHead>
                                <TableHead className="px-6 py-5 text-[10px] font-extrabold uppercase">Status</TableHead>
                                <TableHead className="px-6 py-5 text-[10px] font-extrabold uppercase">
                                    Student<br />Creation Date
                                </TableHead>
                                <TableHead className="px-6 py-5 text-[10px] font-extrabold uppercase">
                                    Action
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {!Array.isArray(students) || students.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Search className="size-8 text-gray-300" />
                                            <Typography as="p" className="text-sm font-medium text-gray-500">
                                                No students found matching your search criteria.
                                            </Typography>
                                            <Typography as="p" className="text-xs text-gray-400">
                                                Try adjusting your filters or search term.
                                            </Typography>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                students.map((student: any) => (
                                    <TableRow
                                        key={student.id}
                                        className={`hover:bg-white/10 transition-colors ${deletingId === student.id ? "opacity-50" : ""}`}
                                    >
                                        <TableCell className="px-6 py-6">
                                            <Typography as="span" className="capitalize text-sm font-bold text-gray-900">
                                                {student.profile?.name}
                                            </Typography>
                                        </TableCell>

                                        <TableCell className="px-6 py-6">
                                            <Typography as="span" className="text-sm font-bold text-brand-byzantine uppercase">
                                                {student.student_code || 'N/A'}
                                            </Typography>
                                        </TableCell>

                                        {/* <TableCell className="px-6 py-6">
                                            <Typography as="span" className="text-sm font-bold text-gray-700">
                                                {student.program}
                                            </Typography>
                                        </TableCell> */}

                                        <TableCell className="px-6 py-6">
                                            <Typography as="span" className="capitalize text-sm font-bold text-gray-700">
                                                {student.country}
                                            </Typography>
                                        </TableCell>

                                        <TableCell className="px-6 py-6 uppercase">
                                            <StatusBadge status={student.status || 'Created'} />
                                        </TableCell>

                                        <TableCell className="px-6 py-6">
                                            <Typography as="span" className="text-sm font-bold text-gray-800">
                                                {new Date(student.created_at).toLocaleDateString()}
                                            </Typography>
                                        </TableCell>

                                        <TableCell className="px-6 py-6">
                                            <div className="flex items-center gap-4 text-gray-600">
                                                <Link href={`/dashboard/student/${student.profile_id}`}>
                                                    <Eye className="size-[18px]" />
                                                </Link>

                                                <Link href={`/dashboard/student/${student.profile_id}/edit`}>
                                                    <Pencil className="size-[18px]" />
                                                </Link>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-5 border-t border-gray-200/20 bg-white/5">
                    <div className="text-xs font-bold text-gray-500">
                        {pagination ? (
                            <>
                                Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
                            </>
                        ) : (
                            `Showing ${students.length} entries`
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => pagination && onPageChange(pagination.page - 1)}
                            disabled={!pagination || pagination.page <= 1}
                            className="size-9 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="size-4" />
                        </button>
                        <button
                            onClick={() => pagination && onPageChange(pagination.page + 1)}
                            disabled={!pagination || pagination.page >= pagination.totalPages}
                            className="size-9 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="size-4" />
                        </button>
                    </div>
                </div>
            </BluryCard>
        </div >
    )
}