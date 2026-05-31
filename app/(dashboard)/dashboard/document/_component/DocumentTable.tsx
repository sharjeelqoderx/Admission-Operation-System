"use client"

import React, { useMemo, useState } from "react"
import { BluryCard } from "@/components/shared/blury-card"
import { Typography } from "@/components/shared/Typography"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ChevronLeft, ChevronRight, AlertCircle, Loader2, FileText } from "lucide-react"
import Link from "next/link"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { cn } from "@/lib/utils"

export type DocumentStudentRow = {
    student_id: string
    student_name: string
    avatar_url: string | null
    document_count: number
    last_uploaded_at: string | null
    last_doc_status: string | null
}

type Props = {
    rows: DocumentStudentRow[]
    isLoading: boolean
    isError: boolean
    onRetry: () => void
}

const COLUMN_COUNT = 5
const PAGE_SIZE = 10

function formatUploadDate(value: string | null) {
    if (!value) return "—"
    return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    })
}

export const DocumentTable = React.memo(function DocumentTable({
    rows,
    isLoading,
    isError,
    onRetry,
}: Props) {
    const [currentPage, setCurrentPage] = useState(1)

    const totalEntries = rows.length
    const totalPages = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE))
    const startIndex = (currentPage - 1) * PAGE_SIZE
    const endIndex = Math.min(startIndex + PAGE_SIZE, totalEntries)

    const currentRows = useMemo(
        () => rows.slice(startIndex, endIndex),
        [rows, startIndex, endIndex]
    )

    if (isLoading) {
        return (
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                blendColorClass="bg-white/10"
                childClass="p-0!"
                className="rounded-lg p-0"
            >
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <Loader2 className="size-8 text-brand-secondary animate-spin" />
                    <Typography as="p" className="text-sm font-medium text-gray-500">
                        Loading students...
                    </Typography>
                </div>
            </BluryCard>
        )
    }

    if (isError) {
        return (
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                blendColorClass="bg-white/10"
                childClass="p-0!"
                className="rounded-lg p-0"
            >
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="size-16 rounded-2xl bg-red-50 flex items-center justify-center">
                        <AlertCircle className="size-8 text-red-400" />
                    </div>
                    <div className="text-center">
                        <Typography as="p" className="text-sm font-bold text-gray-700">
                            Failed to load documents
                        </Typography>
                        <Typography as="p" className="text-xs text-gray-500 mt-1">
                            Check your connection and try again.
                        </Typography>
                    </div>
                    <button
                        onClick={onRetry}
                        className="px-5 py-2 rounded-xl text-sm font-semibold bg-brand-secondary text-white hover:bg-brand-secondary/90 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </BluryCard>
        )
    }

    return (
        <BluryCard
            isCentered={false}
            blurAmount="backdrop-blur-lg"
            blendColorClass="bg-white/10"
            childClass="p-0!"
            className="rounded-lg p-0"
        >
            <div className="overflow-x-auto rounded-xl">
                <Table className="w-full text-left border-collapse min-w-[900px]">
                    <TableHeader className="sticky top-0 z-10">
                        <TableRow className="border-b-2 border-brand-secondary/20 bg-brand-secondary/10 hover:bg-brand-secondary/10">
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Student
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Documents
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Last Uploaded
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Status
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Action
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody className="bg-white/45">
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={COLUMN_COUNT} className="px-8 py-16 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <FileText className="size-8 text-gray-300" />
                                        <Typography as="p" className="text-sm font-medium text-gray-500">
                                            No students found.
                                        </Typography>
                                        <Typography as="p" className="text-xs text-gray-400">
                                            Add a student to manage their documents.
                                        </Typography>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            currentRows.map((row, index) => {
                                const initials = row.student_name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()

                                return (
                                    <TableRow
                                        key={row.student_id}
                                        className={cn(
                                            "border-b border-brand-secondary/15 transition-colors",
                                            index % 2 === 0 ? "bg-white/70" : "bg-white/45",
                                            "hover:bg-brand-secondary/5"
                                        )}
                                    >
                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="size-10 rounded-xl border-2 border-white/50">
                                                    <AvatarImage
                                                        src={
                                                            row.avatar_url ??
                                                            `https://ui-avatars.com/api/?name=${encodeURIComponent(row.student_name)}&background=random`
                                                        }
                                                        alt={row.student_name}
                                                        className="rounded-xl"
                                                    />
                                                    <AvatarFallback className="rounded-xl text-[12px] font-bold">
                                                        {initials}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <Typography as="span" className="text-sm font-bold text-gray-900">
                                                    {row.student_name}
                                                </Typography>
                                            </div>
                                        </TableCell>

                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            <Typography as="span" className="text-sm font-medium text-gray-700">
                                                {row.document_count}
                                            </Typography>
                                        </TableCell>

                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            <Typography as="span" className="text-sm font-medium text-gray-600">
                                                {formatUploadDate(row.last_uploaded_at)}
                                            </Typography>
                                        </TableCell>

                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            {row.last_doc_status ? (
                                                <StatusBadge status={row.last_doc_status} />
                                            ) : (
                                                <Typography as="span" className="text-sm text-gray-400">
                                                    —
                                                </Typography>
                                            )}
                                        </TableCell>

                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            <Button
                                                variant="outline"
                                                className="h-9 px-6 bg-white/20 border-white/40 text-gray-700 hover:bg-white/40 rounded-lg font-bold text-[12px] transition-all shadow-sm"
                                                asChild
                                            >
                                                <Link href={`/dashboard/document/student/${row.student_id}`}>
                                                    View
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>

                    <TableFooter className="border-t-2 border-brand-secondary/20 bg-brand-secondary/10 hover:bg-brand-secondary/10">
                        <TableRow className="hover:bg-brand-secondary/10 border-0">
                            <TableCell colSpan={COLUMN_COUNT} className="px-8 py-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center text-[12px] font-light text-gray-500 space-x-1">
                                        <Typography as="span" className="text-[12px] font-light text-gray-500">
                                            Showing
                                        </Typography>
                                        <Typography as="span" className="text-[12px] font-bold text-brand-blue-text mx-1">
                                            {totalEntries === 0 ? 0 : startIndex + 1}–{endIndex}
                                        </Typography>
                                        <Typography as="span" className="text-[12px] font-light text-gray-500">
                                            of {totalEntries} entries
                                        </Typography>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                            disabled={currentPage <= 1}
                                        >
                                            <ChevronLeft size={16} />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                            disabled={currentPage >= totalPages || totalEntries === 0}
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
        </BluryCard>
    )
})
