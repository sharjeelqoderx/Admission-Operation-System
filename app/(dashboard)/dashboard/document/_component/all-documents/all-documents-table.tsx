"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { BluryCard } from "@/components/shared/blury-card"
import { Typography } from "@/components/shared/Typography"
import { StatusBadge } from "@/components/shared/StatusBadge"
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    AlertCircle,
    Check,
    ChevronLeft,
    ChevronRight,
    Eye,
    X,
} from "lucide-react"
import { PageLoader, Spinner } from "@/components/shared/page-loader"
import { cn } from "@/lib/utils"
import type { AgentAllDocumentRow } from "@/types/schemas/document"

type Props = {
    rows: AgentAllDocumentRow[]
    isLoading: boolean
    isError: boolean
    reviewingDocumentId: string | null
    onRetry: () => void
    onApprove: (documentId: string) => void
    onReject: (documentId: string) => void
}

const COLUMN_COUNT = 6
const PAGE_SIZE = 10

function formatUploadDate(value: string) {
    return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    })
}

function RejectionIndicator({ feedback }: { feedback: string }) {
    return (
        <TooltipProvider>
            <Popover>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                className="size-9 rounded-lg border border-amber-200 bg-amber-50 flex items-center justify-center shrink-0"
                                aria-label="View rejection reason"
                            >
                                <AlertCircle className="size-4 text-amber-600" />
                            </button>
                        </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[260px]">
                        <Typography as="p" className="text-sm whitespace-pre-wrap">
                            {feedback}
                        </Typography>
                    </TooltipContent>
                </Tooltip>
                <PopoverContent align="start" className="w-[300px]">
                    <Typography as="p" font="text" className="font-semibold mb-2">
                        Rejection Reason
                    </Typography>
                    <Typography as="p" className="text-sm text-gray-600 whitespace-pre-wrap">
                        {feedback}
                    </Typography>
                </PopoverContent>
            </Popover>
        </TooltipProvider>
    )
}

export const AllDocumentsTable = React.memo(function AllDocumentsTable({
    rows,
    isLoading,
    isError,
    reviewingDocumentId,
    onRetry,
    onApprove,
    onReject,
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
                <PageLoader className="py-24" />
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
                <Table className="w-full text-left border-collapse min-w-[1100px]">
                    <TableHeader className="sticky top-0 z-10">
                        <TableRow className="border-b-2 border-brand-secondary/20 bg-brand-secondary/10 hover:bg-brand-secondary/10">
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase w-[72px]">
                                Alert
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Document
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Status
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Student
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Uploaded
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody className="bg-white/45">
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={COLUMN_COUNT} className="px-8 py-16 text-center">
                                    <Typography as="p" className="text-sm font-medium text-gray-500">
                                        No documents found.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            currentRows.map((row, index) => {
                                const isReviewing = reviewingDocumentId === row.document_id
                                const isRejected = row.status === "REJECTED" && Boolean(row.feedback)
                                const canReview =
                                    row.file_count > 0 &&
                                    !["APPROVED", "VERIFIED"].includes(row.status)

                                return (
                                    <TableRow
                                        key={row.document_id}
                                        className={cn(
                                            "border-b border-brand-secondary/15 transition-colors",
                                            index % 2 === 0 ? "bg-white/70" : "bg-white/45",
                                            "hover:bg-brand-secondary/5"
                                        )}
                                    >
                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            {isRejected && row.feedback ? (
                                                <RejectionIndicator feedback={row.feedback} />
                                            ) : (
                                                <Typography as="span" className="text-sm text-gray-300">
                                                    —
                                                </Typography>
                                            )}
                                        </TableCell>

                                        <TableCell className="px-6 py-5">
                                            <div className="space-y-1">
                                                <Typography
                                                    as="span"
                                                    className="text-sm font-bold text-gray-900"
                                                >
                                                    {row.document_name}
                                                </Typography>
                                                {row.uploaded_by_name && (
                                                    <Typography
                                                        as="span"
                                                        className="text-[11px] text-gray-500 font-light block"
                                                    >
                                                        Uploaded by {row.uploaded_by_name}
                                                    </Typography>
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            <StatusBadge status={row.status} />
                                        </TableCell>

                                        <TableCell className="px-6 py-5">
                                            <div className="space-y-1">
                                                <Typography
                                                    as="span"
                                                    className="text-sm font-bold text-gray-900"
                                                >
                                                    {row.student_name}
                                                </Typography>
                                                {row.student_code && (
                                                    <Typography
                                                        as="span"
                                                        className="text-[11px] text-gray-500 font-light block"
                                                    >
                                                        ID: {row.student_code}
                                                    </Typography>
                                                )}
                                                {row.campus && (
                                                    <Typography
                                                        as="span"
                                                        className="text-[11px] text-gray-500 font-light block"
                                                    >
                                                        Campus: {row.campus}
                                                    </Typography>
                                                )}
                                                {row.student_country && (
                                                    <Typography
                                                        as="span"
                                                        className="text-[11px] text-gray-500 font-light block"
                                                    >
                                                        {row.student_country}
                                                    </Typography>
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            <Typography as="span" className="text-sm font-medium text-gray-600">
                                                {formatUploadDate(row.uploaded_at)}
                                            </Typography>
                                        </TableCell>

                                        <TableCell className="px-6 py-5 whitespace-nowrap overflow-visible">
                                            <div className="flex flex-wrap items-center gap-2 p-0.5">
                                                {canReview && (
                                                    <>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        type="button"
                                                                        size="icon"
                                                                        className="size-9 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                                                                        disabled={isReviewing}
                                                                        aria-label="Approve document"
                                                                        onClick={() => onApprove(row.document_id)}
                                                                    >
                                                                        {isReviewing ? (
                                                                            <Spinner size="sm" />
                                                                        ) : (
                                                                            <Check className="size-4" />
                                                                        )}
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Approve</TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="size-9 border border-red-300 bg-white text-red-600 hover:bg-red-50 hover:border-red-400 rounded-lg"
                                                                        disabled={isReviewing}
                                                                        aria-label="Reject document"
                                                                        onClick={() => onReject(row.document_id)}
                                                                    >
                                                                        <X className="size-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Reject</TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </>
                                                )}
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-9 border border-gray-200 bg-white/80 text-gray-700 hover:bg-white hover:border-gray-300 rounded-lg"
                                                                asChild
                                                            >
                                                                <Link
                                                                    href={`/dashboard/document/student/${row.student_id}/${row.document_id}`}
                                                                    aria-label="View document"
                                                                >
                                                                    <Eye className="size-4" />
                                                                </Link>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>View</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
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
                                        <Typography
                                            as="span"
                                            className="text-[12px] font-bold text-brand-blue-text mx-1"
                                        >
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
                                            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                            disabled={currentPage <= 1}
                                        >
                                            <ChevronLeft size={16} />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() =>
                                                setCurrentPage((page) => Math.min(totalPages, page + 1))
                                            }
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
