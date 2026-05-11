"use client"

import { useState } from "react"
import { BluryCard } from "@/components/shared/blury-card"
import { Typography } from "@/components/shared/Typography"
import { Button } from "@/components/ui/button"
import {
    Table, TableHeader, TableBody,
    TableRow, TableHead, TableCell,
} from "@/components/ui/table"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ChevronLeft, ChevronRight, Eye, AlertCircle, FileText } from "lucide-react"
import Link from "next/link"
import { StatusBadge } from "@/components/shared/StatusBadge"

type Row = {
    student_id: string
    student_name: string
    avatar_url: string | null
    document_count: number
    last_uploaded_at: string | null
    last_doc_status: string | null
}

type Props = {
    rows: Row[]
    isLoading: boolean
    isError: boolean
    onRetry: () => void
}

export function DocumentTable({ rows, isLoading, isError, onRetry }: Props) {
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 10

    if (isLoading) {
        return (
            <div className="space-y-3 pt-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-16 w-full bg-gray-200 rounded-xl animate-pulse" />
                ))}
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
                    <Typography as="p" className="text-sm font-bold text-gray-700">Failed to load documents</Typography>
                    <Typography as="p" className="text-xs text-gray-500 mt-1">Check your connection and try again.</Typography>
                </div>
                <button
                    onClick={onRetry}
                    className="px-5 py-2 rounded-xl text-sm font-semibold bg-brand-byzantine text-white hover:bg-brand-byzantine/90 transition-colors"
                >
                    Retry
                </button>
            </div>
        )
    }

    if (!rows.length) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
                <div className="size-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <FileText className="size-8 text-gray-400" />
                </div>
                <div className="text-center">
                    <Typography as="p" className="text-sm font-bold text-gray-700">No documents yet</Typography>
                    <Typography as="p" className="text-xs text-gray-500 mt-1">Upload a document to see it here.</Typography>
                </div>
            </div>
        )
    }

    // Pagination Logic
    const totalEntries = rows.length
    const totalPages = Math.ceil(totalEntries / pageSize)
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, totalEntries)
    const currentRows = rows.slice(startIndex, endIndex)

    const handlePrev = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1)
    }

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1)
    }

    return (
        <div className="space-y-4 pt-4">
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                blendColorClass="bg-white/10"
                childClass="p-0!"
                className="rounded-lg p-0"
            >
                <div className="overflow-x-auto">
                    <Table className="w-full text-left border-collapse min-w-[700px]">
                        <TableHeader>
                            <TableRow className="border-b border-white/20 bg-white/30 hover:bg-white/30">
                                <TableHead className="px-6 py-5 text-[10px] font-extrabold uppercase tracking-widest text-gray-600">Student Name</TableHead>
                                <TableHead className="px-6 py-5 text-[10px] font-extrabold uppercase tracking-widest text-gray-600">Number of Documents</TableHead>
                                <TableHead className="px-6 py-5 text-[10px] font-extrabold uppercase tracking-widest text-gray-600">Last Uploaded At</TableHead>
                                <TableHead className="px-6 py-5 text-[10px] font-extrabold uppercase tracking-widest text-gray-600">Status</TableHead>
                                <TableHead className="px-6 py-5 text-[10px] font-extrabold uppercase tracking-widest text-gray-600">Action</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {currentRows.map((row) => (
                                <TableRow key={row.student_id} className="hover:bg-white/10 transition-colors">
                                    <TableCell className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="size-9 rounded-xl border-2 border-white/50">
                                                <AvatarImage src={row.avatar_url ?? undefined} alt={row.student_name} className="rounded-xl" />
                                                <AvatarFallback className="rounded-xl text-[11px] font-bold bg-brand-byzantine/10 text-brand-byzantine">
                                                    {row.student_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <Typography as="span" className="text-sm font-bold text-gray-900">
                                                {row.student_name}
                                            </Typography>
                                        </div>
                                    </TableCell>

                                    <TableCell className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <Typography as="span" className="text-sm font-bold text-gray-800">
                                                {row.document_count}
                                            </Typography>
                                        </div>
                                    </TableCell>

                                    <TableCell className="px-6 py-5">
                                        <Typography as="span" className="text-sm font-medium text-gray-600">
                                            {row.last_uploaded_at
                                                ? new Date(row.last_uploaded_at).toLocaleDateString("en-GB", {
                                                    day: "2-digit", month: "short", year: "numeric",
                                                })
                                                : "—"}
                                        </Typography>
                                    </TableCell>

                                    <TableCell className="px-6 py-5">
                                        {row.last_doc_status
                                            ? <StatusBadge status={row.last_doc_status} />
                                            : <Typography as="span" className="text-sm text-gray-400">—</Typography>
                                        }
                                    </TableCell>

                                    <TableCell className="px-6 py-5">
                                        <Link href={`/dashboard/document/student/${row.student_id}`}>
                                            <Button variant="outline" className="h-9 px-5 gap-2">
                                                View
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between px-6 py-5 border-t border-white/20 bg-white/5">
                    <div className="flex items-center text-[12px] font-light text-gray-500 space-x-1.5">
                        <span>Showing</span>
                        <span className="text-gray-900 font-bold">{totalEntries === 0 ? 0 : startIndex + 1}</span>
                        <span>to</span>
                        <span className="text-gray-900 font-bold">{endIndex}</span>
                        <span>of</span>
                        <span className="text-gray-900 font-bold">{totalEntries}</span>
                        <span>entries</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrev}
                            disabled={currentPage === 1}
                            className="size-9 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="size-4" />
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="size-9 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="size-4" />
                        </button>
                    </div>
                </div>
            </BluryCard>
        </div>
    )
}
