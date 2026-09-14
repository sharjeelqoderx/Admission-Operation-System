"use client"

import React from "react"
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
    AlertCircle,
    ChevronLeft,
    ChevronRight,
} from "lucide-react"
import { TableSkeleton } from "@/components/shared/table-skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { AgentAllDocumentRow, DocumentListPagination } from "@/types/schemas/document"
import { DocumentRowActionsMenu } from "../document-row-actions-menu"
import { DocumentRejectionIndicator } from "../document-rejection-indicator"

type Props = {
    rows: AgentAllDocumentRow[]
    pagination: DocumentListPagination
    page: number
    isLoading: boolean
    isFetching?: boolean
    isError: boolean
    reviewingDocumentId: string | null
    onRetry: () => void
    onPageChange: (page: number) => void
    onApprove: (documentId: string) => void
    onReject: (documentId: string) => void
}

const COLUMN_COUNT = 6

function formatUploadDate(value: string) {
    return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    })
}

function getStudentInitials(name: string) {
    return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
}

export const AllDocumentsTable = React.memo(function AllDocumentsTable({
    rows,
    pagination,
    page,
    isLoading,
    isError,
    reviewingDocumentId,
    onRetry,
    onPageChange,
    onApprove,
    onReject,
}: Props) {
    const totalEntries = pagination.total
    const totalPages = pagination.totalPages
    const startIndex = totalEntries === 0 ? 0 : (page - 1) * pagination.limit
    const endIndex = Math.min(startIndex + rows.length, totalEntries)

    if (isLoading) {
        return (
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                blendColorClass="bg-white/10"
                childClass="p-0!"
                className="rounded-lg p-0"
            >
                <TableSkeleton columns={6} rows={6} showFooter />
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
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase min-w-[200px]">
                                Student
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Document
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Status
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
                            rows.map((row, index) => {
                                const isReviewing = reviewingDocumentId === row.document_id
                                const isRejected =
                                    row.status === "REJECTED" &&
                                    row.rejection_history.length > 0
                                const canReview =
                                    row.file_count > 0 &&
                                    !["APPROVED", "VERIFIED"].includes(row.status)
                                const initials = getStudentInitials(row.student_name)
                                const avatarSrc =
                                    row.avatar_url ??
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(row.student_name)}&background=random`

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
                                            {isRejected ? (
                                                <DocumentRejectionIndicator
                                                    history={row.rejection_history}
                                                    placement="bottom-right"
                                                />
                                            ) : null}
                                        </TableCell>

                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="size-10 rounded-xl border-2 border-white/50 shrink-0">
                                                    <AvatarImage
                                                        src={avatarSrc}
                                                        alt={row.student_name}
                                                        className="rounded-xl"
                                                    />
                                                    <AvatarFallback className="rounded-xl text-[12px] font-bold">
                                                        {initials}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <Typography as="span" className="text-sm font-bold text-gray-900">
                                                        {row.student_name}
                                                    </Typography>
                                                    <Typography
                                                        as="span"
                                                        className="text-[11px] text-gray-500 font-light"
                                                    >
                                                        ID: {row.student_code ?? "N/A"}
                                                    </Typography>
                                                </div>
                                            </div>
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

                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            <Typography as="span" className="text-sm font-medium text-gray-600">
                                                {formatUploadDate(row.uploaded_at)}
                                            </Typography>
                                        </TableCell>

                                        <TableCell className="px-6 py-5 whitespace-nowrap overflow-visible">
                                            <DocumentRowActionsMenu
                                                mode="review"
                                                viewHref={`/dashboard/document/student/${row.student_id}/${row.document_id}`}
                                                canReview={canReview}
                                                isReviewing={isReviewing}
                                                onAccept={() => onApprove(row.document_id)}
                                                onDecline={() => onReject(row.document_id)}
                                            />
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
                                            onClick={() => onPageChange(page - 1)}
                                            disabled={page <= 1}
                                        >
                                            <ChevronLeft size={16} />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => onPageChange(page + 1)}
                                            disabled={page >= totalPages || totalEntries === 0}
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
