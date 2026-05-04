"use client"

import { Typography } from "@/components/shared/Typography"
import {
    Search,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Eye,
    Pencil,
    Trash2,
    AlertCircle
} from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"

// shadcn table imports
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table"

type Student = any

type Props = {
    students: Student[]
    isLoading: boolean
    isError: boolean
    deletingId: string | null
    onDelete: (id: string, name: string) => void
    onRetry: () => void
}

export function StudentTable({
    students,
    isLoading,
    isError,
    deletingId,
    onDelete,
    onRetry,
}: Props) {
    if (isLoading) {
        return (
            <div className="space-y-4 pt-4">
                <div className="h-7 w-36 bg-gray-200 rounded-lg animate-pulse" />

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="h-11 flex-1 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="h-11 w-full sm:w-64 bg-gray-200 rounded-lg animate-pulse" />
                </div>

                <div className="flex items-center gap-2 pt-2">
                    <div className="h-7 w-24 bg-gray-200 rounded-full animate-pulse" />
                    <div className="h-7 w-20 bg-gray-200 rounded-full animate-pulse" />
                    <div className="h-7 w-20 bg-gray-200 rounded-full animate-pulse" />
                </div>

                <div className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden" />
            </div>
        )
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="size-16 rounded-2xl bg-red-50 flex items-center justify-center">
                    <AlertCircle className="size-8 text-red-400" />
                </div>

                <div className="text-center">
                    <Typography as="p" className="text-sm font-bold text-gray-700">
                        Failed to load students
                    </Typography>
                    <Typography as="p" className="text-xs text-gray-500 mt-1">
                        Check your connection and try again.
                    </Typography>
                </div>

                <button
                    onClick={onRetry}
                    className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#9B51E0] text-white hover:bg-[#8a42cf] transition-colors"
                >
                    Retry
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-4 pt-4">
            <Typography as="h3" className="text-xl font-bold text-[#1e3a8a]">
                Students list
            </Typography>

            {/* Search + Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 ps-1">
                    <Search className="absolute left-3 top-1/2 z-10 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Enter to search"
                        className="w-full bg-white/40 backdrop-blur-md ps-12"
                    />
                </div>

                <div className="relative w-full sm:w-64">
                    <select className="w-full h-full px-4 appearance-none rounded-md bg-white/40 backdrop-blur-md border border-white/40 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#9B51E0]/20">
                        <option>Status</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 pt-2">
                <button className="px-5 py-1.5 rounded-full bg-[#1e3a8a] text-white text-xs font-medium shadow-sm">
                    All Students
                </button>
                <button className="px-5 py-1.5 rounded-full bg-[#8ba4d5] text-white text-xs font-medium hover:bg-[#1e3a8a]">
                    Program
                </button>
                <button className="px-5 py-1.5 rounded-full bg-[#8ba4d5] text-white text-xs font-medium hover:bg-[#1e3a8a]">
                    Country
                </button>
            </div>

            {/* Table */}
            <div className="w-full bg-white/5 backdrop-blur-xl border-x border-white/40 p-2 rounded-l-lg rounded-r-lg shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <Table className="w-full text-left border-collapse">
                        <TableHeader>
                            <TableRow className="border-b border-gray-200/20">
                                <TableHead className="px-6 py-5 text-[10px] font-extrabold uppercase">Student Name</TableHead>
                                <TableHead className="px-6 py-5 text-[10px] font-extrabold uppercase">Program</TableHead>
                                <TableHead className="px-6 py-5 text-[10px] font-extrabold uppercase">Country</TableHead>
                                <TableHead className="px-6 py-5 text-[10px] font-extrabold uppercase">Status</TableHead>
                                <TableHead className="px-6 py-5 text-[10px] font-extrabold uppercase">
                                    Application<br />Creation Date
                                </TableHead>
                                <TableHead className="px-6 py-5 text-[10px] font-extrabold uppercase">
                                    Action
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {students.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="px-6 py-8 text-center text-gray-500 text-sm">
                                        No students found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                students.map((student: any) => (
                                    <TableRow
                                        key={student.id}
                                        className={`hover:bg-white/10 transition-colors ${deletingId === student.id ? "opacity-50" : ""}`}
                                    >
                                        <TableCell className="px-6 py-6">
                                            <Typography as="span" className="text-sm font-bold text-gray-900">
                                                {student.profile?.name}
                                            </Typography>
                                        </TableCell>

                                        <TableCell className="px-6 py-6">
                                            <Typography as="span" className="text-sm font-bold text-gray-700">
                                                {student.program}
                                            </Typography>
                                        </TableCell>

                                        <TableCell className="px-6 py-6">
                                            <Typography as="span" className="text-sm font-bold text-gray-700">
                                                {student.country}
                                            </Typography>
                                        </TableCell>

                                        <TableCell className="px-6 py-6">
                                            <span className="inline-flex px-4 py-1.5 rounded-lg text-[10px] font-extrabold uppercase bg-[#4285f4] text-white">
                                                {student.status || 'CREATED'}
                                            </span>
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

                                                <button
                                                    onClick={() => onDelete(student.id, student.profile?.name)}
                                                    disabled={deletingId === student.id}
                                                >
                                                    <Trash2 className="size-[18px]" />
                                                </button>
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
                        Showing {students.length} entries
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="size-9 rounded-xl bg-white/20 flex items-center justify-center">
                            <ChevronLeft className="size-4" />
                        </button>
                        <button className="size-9 rounded-xl bg-white/20 flex items-center justify-center">
                            <ChevronRight className="size-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}