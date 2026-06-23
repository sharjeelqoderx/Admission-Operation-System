"use client"

import React from "react"
import Link from "next/link"
import { Typography } from "@/components/shared/Typography"
import {
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    Loader2,
    Search,
} from "lucide-react"
import { formatLocation } from "@/lib/utils/location"
import { requiresApsRequirement } from "@/lib/utils/aps"
import {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table"
import { BluryCard } from "@/components/shared/blury-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

export type StudentRow = {
    id: string
    profile_id: string
    student_code: string | null
    city: string | null
    state?: string | null
    country: string | null
    nationality: string | null
    aps_requirement?: boolean | null
    guardian_email: string | null
    guardian_phone: string | null
    created_at: string
    documents_uploaded_count?: number
    total_document_types?: number
    document_upload_percentage?: number
    highest_qualification?: string | null
    profile: {
        id: string
        name: string | null
        email: string | null
        phone: string | null
        avatar_url: string | null
        gender: string | null
        date_of_birth: string | null
    } | null
}

type Props = {
    students: StudentRow[]
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

const COLUMN_COUNT = 12

function formatCreatedDate(value: string) {
    return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    })
}

function formatDateOfBirth(value: string | null | undefined) {
    if (!value) return "—"
    return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    })
}

export const StudentTable = React.memo(function StudentTable({
    students,
    isLoading,
    isError,
    errorMessage,
    deletingId,
    pagination,
    onRetry,
    onPageChange,
}: Props) {
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
                    <div className="text-center px-4">
                        <Typography as="p" className="text-sm font-bold text-gray-700">
                            {errorMessage || "Failed to load students"}
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
            <div className="w-full overflow-x-scroll rounded-xl max-w-full pb-2">
                <Table className="w-full text-left border-collapse min-w-[1750px]">
                    <TableHeader className="sticky top-0 z-10">
                        <TableRow className="border-b-2 border-brand-secondary/20 bg-brand-secondary/10 hover:bg-brand-secondary/10">
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Student
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Student ID
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Phone
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Location
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Nationality
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Highest Qualification
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                APS Requirement
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Guardian
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                DOB
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Documents
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Created
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Action
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody className="bg-white/45">
                        {!Array.isArray(students) || students.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={COLUMN_COUNT} className="px-8 py-16 text-center">
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
                            students.map((student, index) => {
                                const studentName = student.profile?.name ?? "—"
                                const initials = studentName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()

                                const apsRequired =
                                    student.aps_requirement ??
                                    requiresApsRequirement(student.country)

                                return (
                                    <TableRow
                                        key={student.id}
                                        className={cn(
                                            "border-b border-brand-secondary/15 transition-colors",
                                            index % 2 === 0 ? "bg-white/70" : "bg-white/45",
                                            "hover:bg-brand-secondary/5",
                                            deletingId === student.id && "opacity-50"
                                        )}
                                    >
                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="size-10 rounded-xl border-2 border-white/50">
                                                    <AvatarImage
                                                        src={
                                                            student.profile?.avatar_url ??
                                                            `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=random`
                                                        }
                                                        alt={studentName}
                                                        className="rounded-xl"
                                                    />
                                                    <AvatarFallback className="rounded-xl text-[12px] font-bold">
                                                        {initials}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <Typography as="span" className="text-sm font-bold text-gray-900 capitalize">
                                                        {studentName}
                                                    </Typography>
                                                    {student.profile?.email && (
                                                        <Typography as="span" className="text-[11px] text-gray-500 font-light">
                                                            {student.profile.email}
                                                        </Typography>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            <Typography as="span" className="text-sm font-bold text-brand-blue-text uppercase">
                                                {student.student_code ?? "—"}
                                            </Typography>
                                        </TableCell>

                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            <Typography as="span" className="text-sm font-medium text-gray-700">
                                                {student.profile?.phone ?? "—"}
                                            </Typography>
                                        </TableCell>

                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            <Typography as="span" className="text-sm font-medium text-gray-700">
                                                {formatLocation({
                                                    city: student.city,
                                                    state: student.state,
                                                    country: student.country,
                                                })}
                                            </Typography>
                                        </TableCell>

                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            <Typography as="span" className="text-sm font-medium text-gray-600">
                                                {student.nationality ?? "—"}
                                            </Typography>
                                        </TableCell>

                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            <Typography as="span" className="text-sm font-medium text-gray-700">
                                                {student.highest_qualification ?? "—"}
                                            </Typography>
                                        </TableCell>

                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            <Typography
                                                as="span"
                                                className={cn(
                                                    "text-sm font-bold",
                                                    apsRequired ? "text-amber-700" : "text-gray-500"
                                                )}
                                            >
                                                {apsRequired ? "Yes" : "No"}
                                            </Typography>
                                        </TableCell>

                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <Typography as="span" className="text-sm font-medium text-gray-700">
                                                    {student.guardian_email ?? "—"}
                                                </Typography>
                                                {student.guardian_phone && (
                                                    <Typography as="span" className="text-[11px] text-gray-500 font-light">
                                                        {student.guardian_phone}
                                                    </Typography>
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            <Typography as="span" className="text-sm font-medium text-gray-600">
                                                {formatDateOfBirth(student.profile?.date_of_birth)}
                                            </Typography>
                                        </TableCell>

                                        <TableCell className="px-6 py-5 whitespace-nowrap min-w-[140px]">
                                            <div className="flex flex-col gap-1.5">
                                                {student.profile_id ? (
                                                    <Link
                                                        href={`/dashboard/document/student/${student.profile_id}`}
                                                        className="block rounded-lg p-2 -m-2 hover:bg-brand-secondary/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary/40"
                                                        aria-label={`View documents for ${studentName}`}
                                                    >
                                                        <Typography as="span" className="text-sm font-bold text-brand-blue-text">
                                                            {student.document_upload_percentage ?? 0}%
                                                        </Typography>
                                                        <Progress
                                                            value={student.document_upload_percentage ?? 0}
                                                            className="h-1.5 w-24 mt-1.5"
                                                        />
                                                        <Typography as="span" className="text-[11px] text-gray-500 font-light mt-1.5 block">
                                                            {student.documents_uploaded_count ?? 0}/{student.total_document_types ?? 0} uploaded
                                                        </Typography>
                                                    </Link>
                                                ) : (
                                                    <>
                                                        <Typography as="span" className="text-sm font-bold text-brand-blue-text">
                                                            {student.document_upload_percentage ?? 0}%
                                                        </Typography>
                                                        <Progress
                                                            value={student.document_upload_percentage ?? 0}
                                                            className="h-1.5 w-24"
                                                        />
                                                        <Typography as="span" className="text-[11px] text-gray-500 font-light">
                                                            {student.documents_uploaded_count ?? 0}/{student.total_document_types ?? 0} uploaded
                                                        </Typography>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            <Typography as="span" className="text-sm font-medium text-gray-600">
                                                {formatCreatedDate(student.created_at)}
                                            </Typography>
                                        </TableCell>

                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            <Button
                                                variant="outline"
                                                className="h-9 px-6 bg-white/20 border-white/40 text-gray-700 hover:bg-white/40 rounded-lg font-bold text-[12px] transition-all shadow-sm"
                                                asChild
                                            >
                                                <Link href={`/dashboard/student/${student.profile_id}`}>
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
                                        {pagination ? (
                                            <>
                                                <Typography as="span" className="text-[12px] font-light text-gray-500">
                                                    Showing
                                                </Typography>
                                                <Typography as="span" className="text-[12px] font-bold text-brand-blue-text mx-1">
                                                    {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}–{Math.min(pagination.page * pagination.limit, pagination.total)}
                                                </Typography>
                                                <Typography as="span" className="text-[12px] font-light text-gray-500">
                                                    of {pagination.total} entries
                                                </Typography>
                                            </>
                                        ) : (
                                            <>
                                                <Typography as="span" className="text-[12px] font-light text-gray-500">
                                                    Showing
                                                </Typography>
                                                <Typography as="span" className="text-[12px] font-bold text-brand-blue-text mx-1">
                                                    {students.length}
                                                </Typography>
                                                <Typography as="span" className="text-[12px] font-light text-gray-500">
                                                    entries
                                                </Typography>
                                            </>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => pagination && onPageChange(pagination.page - 1)}
                                            disabled={!pagination || pagination.page <= 1}
                                        >
                                            <ChevronLeft size={16} />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => pagination && onPageChange(pagination.page + 1)}
                                            disabled={!pagination || pagination.page >= pagination.totalPages}
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
