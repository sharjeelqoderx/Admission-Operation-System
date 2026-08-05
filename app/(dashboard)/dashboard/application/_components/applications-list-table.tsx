"use client"

import React, { useMemo } from "react"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { ApplicationStatusBadge } from "./application-status-badge"
import { DocumentRejectionIndicator } from "@/app/(dashboard)/dashboard/document/_component/document-rejection-indicator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react"
import { PageLoader } from "@/components/shared/page-loader"
import Link from "next/link"
import { formatIntakeDate, formatProgramDate } from "@/lib/utils/program"
import { cn } from "@/lib/utils"
import { isUniversityStaffRole } from "@/lib/auth/university-role"
import { Role } from "@/types/enums/role"
import { Progress } from "@/components/ui/progress"
import type {
    ApplicationListItem,
    ApplicationListPagination,
} from "@/types/schemas/application"
import type { ApplicationProfileRole } from "@/types/schemas/application"
import type { DocumentRejectionHistoryEntry } from "@/types/schemas/document"
import { formatFullName } from "@/lib/utils/profile"

function toRejectionIndicatorHistory(
    history: ApplicationListItem["rejection_history"]
): DocumentRejectionHistoryEntry[] {
    return history
        .filter((entry) => Boolean(entry.feedback?.trim()))
        .map((entry) => ({
            feedback: entry.feedback!.trim(),
            created_at: entry.created_at,
        }))
}

export type ApplicationRow = ApplicationListItem

type Props = {
    applications: ApplicationListItem[]
    role?: ApplicationProfileRole
    isLoading: boolean
    isFetching?: boolean
    isError: boolean
    onRetry: () => void
    pagination?: ApplicationListPagination
    onPageChange?: (page: number) => void
    showPagination?: boolean
    viewBasePath?: string
}

function formatSubmittedDate(value: string) {
    return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    })
}

function getRejectionIndicatorHistory(app: ApplicationListItem) {
    return toRejectionIndicatorHistory(app.rejection_history ?? [])
}

function getDocumentVaultHref(
    app: ApplicationListItem,
    variant: "degree" | "student",
    fallbackStudentId?: string
): string | null {
    const studentId = app.student?.id ?? fallbackStudentId

    if (!studentId) return null

    if (variant === "student") {
        return `/dashboard/document/student/${studentId}?from=applications`
    }

    const degreeId = app.course?.degree?.id
    if (!degreeId) return null

    return `/dashboard/document/student/${studentId}/degree/${degreeId}?from=applications`
}

export function DocumentVaultCell({
    app,
    variant = "degree",
    fallbackStudentId,
}: {
    app: ApplicationListItem
    variant?: "degree" | "student"
    fallbackStudentId?: string
}) {
    const href = getDocumentVaultHref(app, variant, fallbackStudentId)
    const content = (
        <div className="flex flex-col gap-1.5">
            <Typography as="span" className="text-sm font-bold text-brand-blue-text">
                {app.document_vault_percentage ?? 0}%
            </Typography>
            <Progress value={app.document_vault_percentage ?? 0} className="h-1.5 w-24" />
            <Typography as="span" className="text-[11px] text-gray-500 font-light">
                {app.documents_uploaded_count ?? 0}/{app.total_required_documents ?? 0} attached
            </Typography>
        </div>
    )

    if (!href) {
        return content
    }

    return (
        <Link
            href={href}
            scroll={false}
            className="block rounded-lg p-2 -m-2 hover:bg-brand-secondary/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary/40"
            aria-label={`View documents for ${formatFullName(app.student?.first_name, app.student?.last_name, "student")}`}
        >
            {content}
        </Link>
    )
}

export const ApplicationsListTable = React.memo(function ApplicationsListTable({
    applications,
    role = Role.AGENT,
    isLoading,
    isFetching = false,
    isError,
    onRetry,
    pagination,
    onPageChange,
    showPagination = true,
    viewBasePath = "/dashboard/application",
}: Props) {
    const isStudent = role === Role.STUDENT
    const isAgent = role === Role.AGENT
    const showStudentColumn = !isStudent
    const showAgentColumn = isUniversityStaffRole(role)
    const showRejectionAlertColumn = isStudent || isAgent
    const showExtendedProgramColumns = isStudent || isAgent

    const columnCount = useMemo(() => {
        if (isStudent) return 9
        if (isAgent) return 10
        if (showAgentColumn) return 7
        return 6
    }, [isStudent, isAgent, showAgentColumn])

    const tableMinWidth = isAgent ? "min-w-[1320px]" : "min-w-[1020px]"

    const total = pagination?.total ?? applications.length
    const page = pagination?.page ?? 1
    const limit = pagination?.limit ?? Math.max(applications.length, 1)
    const totalPages = Math.max(1, pagination?.totalPages ?? 1)
    const startIndex = total === 0 ? 0 : (page - 1) * limit + 1
    const endIndex = total === 0 ? 0 : Math.min(page * limit, total)
    const canPaginate = Boolean(showPagination && pagination && onPageChange)

    if (isLoading || isFetching) {
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
                            Failed to load applications
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
            <div className="relative overflow-x-auto rounded-xl">
                <Table className={cn("w-full text-left border-collapse", tableMinWidth)}>
                    <TableHeader className="sticky top-0 z-10">
                        <TableRow className="border-b-2 border-brand-secondary/20 bg-brand-secondary/10 hover:bg-brand-secondary/10">
                            {showRejectionAlertColumn && (
                                <TableHead className="w-12 px-3" aria-hidden />
                            )}
                            {showStudentColumn && (
                                <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                    Student
                                </TableHead>
                            )}
                            <TableHead className="max-w-[220px] px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Program
                            </TableHead>
                            {showExtendedProgramColumns && (
                                <>
                                    <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                        Fees
                                    </TableHead>
                                    <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                        Intake
                                    </TableHead>
                                    <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                        Deadline
                                    </TableHead>
                                </>
                            )}
                            {showAgentColumn && (
                                <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                    University Partner
                                </TableHead>
                            )}
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase min-w-[140px]">
                                Document Vault
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Status
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Submitted
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Action
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody className="bg-white/45">
                        {applications.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columnCount} className="px-8 py-16 text-center">
                                    <Typography as="p" className="text-sm text-gray-500 font-medium">
                                        No applications found. Create your first application!
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            applications.map((app, index) => {
                                const studentName = formatFullName(
                                    app.student?.first_name,
                                    app.student?.last_name,
                                    "—"
                                )
                                const initials = studentName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()

                                const rejectionHistory = getRejectionIndicatorHistory(app)

                                return (
                                    <TableRow
                                        key={app.id}
                                        className={cn(
                                            "border-b border-brand-secondary/15 transition-colors",
                                            index % 2 === 0 ? "bg-white/70" : "bg-white/45",
                                            "hover:bg-brand-secondary/5"
                                        )}
                                    >
                                        {showRejectionAlertColumn && (
                                            <TableCell className="px-3 py-5 whitespace-nowrap">
                                                {rejectionHistory.length > 0 ? (
                                                    <DocumentRejectionIndicator
                                                        history={rejectionHistory}
                                                        placement="bottom-right"
                                                    />
                                                ) : null}
                                            </TableCell>
                                        )}

                                        {showStudentColumn && (
                                            <TableCell className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="size-10 rounded-xl border-2 border-white/50">
                                                        <AvatarImage
                                                            src={
                                                                app.student?.avatar_url ??
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
                                                        <Typography
                                                            as="span"
                                                            className="text-sm font-bold text-gray-900"
                                                        >
                                                            {studentName}
                                                        </Typography>
                                                        {app.student?.student_code && (
                                                            <Typography
                                                                as="span"
                                                                className="text-xs font-normal text-muted-foreground"
                                                            >
                                                                ID: {app.student.student_code}
                                                            </Typography>
                                                        )}
                                                        {app.student?.email && (
                                                            <Typography
                                                                as="span"
                                                                className="text-xs font-normal text-muted-foreground"
                                                            >
                                                                {app.student.email}
                                                            </Typography>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                        )}

                                        <TableCell className="max-w-[220px] px-6 py-5">
                                            <div className="min-w-0 max-w-[220px]">
                                                <Typography
                                                    as="span"
                                                    className="block truncate text-sm font-bold text-gray-700"
                                                    title={app.course?.name ?? undefined}
                                                >
                                                    {app.course?.name ?? "—"}
                                                </Typography>
                                                {app.course?.degree?.name && (
                                                    <Typography
                                                        as="span"
                                                        className="block truncate text-xs font-normal text-muted-foreground"
                                                        title={app.course.degree.name}
                                                    >
                                                        {app.course.degree.name}
                                                    </Typography>
                                                )}
                                            </div>
                                        </TableCell>

                                        {showExtendedProgramColumns && (
                                            <>
                                                <TableCell className="px-6 py-5 whitespace-nowrap">
                                                    <Typography
                                                        as="span"
                                                        className="text-sm font-medium text-gray-700"
                                                    >
                                                        {app.course?.degree?.fees ?? "Contact University"}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell className="px-6 py-5 whitespace-nowrap">
                                                    <Typography
                                                        as="span"
                                                        className="text-xs font-normal text-muted-foreground"
                                                    >
                                                        {formatIntakeDate(app.course?.degree?.intake_date)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell className="px-6 py-5 whitespace-nowrap">
                                                    <Typography
                                                        as="span"
                                                        className="text-xs font-normal text-muted-foreground"
                                                    >
                                                        {formatProgramDate(app.course?.deadline_date)}
                                                    </Typography>
                                                </TableCell>
                                            </>
                                        )}

                                        {showAgentColumn && (
                                            <TableCell className="px-6 py-5 whitespace-nowrap">
                                                <Typography
                                                    as="span"
                                                    className="text-sm font-light text-gray-600"
                                                >
                                                    {formatFullName(
                                                        app.agent?.first_name,
                                                        app.agent?.last_name,
                                                        "—"
                                                    )}
                                                </Typography>
                                            </TableCell>
                                        )}

                                        <TableCell className="px-6 py-5 whitespace-nowrap min-w-[140px]">
                                            <DocumentVaultCell app={app} />
                                        </TableCell>

                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex flex-col gap-1.5">
                                                <ApplicationStatusBadge
                                                    status={app.status}
                                                    offerLetter={app.offer_letter}
                                                />
                                            </div>
                                        </TableCell>

                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            <Typography
                                                as="span"
                                                className="text-sm font-medium text-gray-600"
                                            >
                                                {formatSubmittedDate(app.created_at)}
                                            </Typography>
                                        </TableCell>

                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            <Button
                                                variant="outline"
                                                className="h-9 px-6 bg-white/20 border-white/40 text-gray-700 hover:bg-white/40 rounded-lg font-bold text-[12px] transition-all shadow-sm"
                                                asChild
                                            >
                                                <Link href={`${viewBasePath}/${app.id}`}>View</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>

                    <TableFooter className="border-t-2 border-brand-secondary/20 bg-brand-secondary/10 hover:bg-brand-secondary/10">
                        <TableRow className="hover:bg-brand-secondary/10 border-0">
                            <TableCell colSpan={columnCount} className="px-8 py-5">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex flex-wrap items-center gap-x-1 text-[12px] font-light text-gray-500">
                                        <Typography
                                            as="span"
                                            className="text-[12px] font-light text-gray-500"
                                        >
                                            Showing
                                        </Typography>
                                        <Typography
                                            as="span"
                                            className="text-[12px] font-bold text-brand-blue-text"
                                        >
                                            {canPaginate
                                                ? `${startIndex}–${endIndex}`
                                                : applications.length}
                                        </Typography>
                                        <Typography
                                            as="span"
                                            className="text-[12px] font-light text-gray-500"
                                        >
                                            of
                                        </Typography>
                                        <Typography
                                            as="span"
                                            className="text-[12px] font-bold text-brand-blue-text"
                                        >
                                            {canPaginate ? total : applications.length}
                                        </Typography>
                                        <Typography
                                            as="span"
                                            className="text-[12px] font-light text-gray-500"
                                        >
                                            total
                                        </Typography>
                                    </div>

                                    {showPagination && (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() =>
                                                    onPageChange?.(Math.max(1, page - 1))
                                                }
                                                disabled={!canPaginate || page <= 1}
                                            >
                                                <ChevronLeft size={16} />
                                            </Button>
                                            <Typography
                                                as="span"
                                                className="min-w-[72px] text-center text-[12px] font-medium text-gray-600"
                                            >
                                                {canPaginate
                                                    ? `${page} / ${Math.max(totalPages, 1)}`
                                                    : "1 / 1"}
                                            </Typography>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() =>
                                                    onPageChange?.(
                                                        Math.min(
                                                            Math.max(totalPages, 1),
                                                            page + 1
                                                        )
                                                    )
                                                }
                                                disabled={
                                                    !canPaginate ||
                                                    page >= totalPages ||
                                                    total === 0
                                                }
                                            >
                                                <ChevronRight size={16} />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>
        </BluryCard>
    )
})
