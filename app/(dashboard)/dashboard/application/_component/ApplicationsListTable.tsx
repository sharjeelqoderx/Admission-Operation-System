import React, { useMemo } from "react"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { StatusBadge } from "@/components/shared/StatusBadge"
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
import { ChevronLeft, ChevronRight, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { formatIntakeDate, formatProgramDate } from "@/lib/utils/program"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { ApplicationStatus } from "@/components/shared/StatusBadge"

export type ApplicationRow = {
    id: string
    application_no: string | null
    status: string
    created_at: string
    student: {
        id: string
        name: string | null
        avatar_url: string | null
        email: string | null
        student_code?: string | null
    } | null
    course: {
        id: string
        name: string | null
        deadline_date?: string | null
        degree?: { id: string; name: string; fees?: string | null; intake_date?: string | null } | null
    } | null
    agent: { id: string; name: string | null } | null
    offer_shared?: boolean
    offer_status?: string | null
    documents_uploaded_count?: number
    total_required_documents?: number
    document_vault_percentage?: number
}

type Props = {
    applications: ApplicationRow[]
    role?: "AGENT" | "STUDENT" | "UNIVERSITY"
    isLoading: boolean
    isError: boolean
    onRetry: () => void
    showPagination?: boolean
}

function formatSubmittedDate(value: string) {
    return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    })
}

function getApplicationNumber(app: ApplicationRow) {
    return app.application_no ?? `APP-${app.id.slice(0, 8).toUpperCase()}`
}

function getDocumentVaultHref(
    app: ApplicationRow,
    variant: "degree" | "student",
    fallbackStudentId?: string
): string | null {
    const studentId = app.student?.id ?? fallbackStudentId

    if (!studentId) return null

    if (variant === "student") {
        return `/dashboard/document/student/${studentId}`
    }

    const degreeId = app.course?.degree?.id
    if (!degreeId) return null

    return `/dashboard/document/student/${studentId}/degree/${degreeId}`
}

export function DocumentVaultCell({
    app,
    variant = "degree",
    fallbackStudentId,
}: {
    app: ApplicationRow
    variant?: "degree" | "student"
    fallbackStudentId?: string
}) {
    const href = getDocumentVaultHref(app, variant, fallbackStudentId)
    const content = (
        <div className="flex flex-col gap-1.5">
            <Typography as="span" className="text-sm font-bold text-brand-blue-text">
                {app.document_vault_percentage ?? 0}%
            </Typography>
            <Progress
                value={app.document_vault_percentage ?? 0}
                className="h-1.5 w-24"
            />
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
            aria-label={`View documents for ${app.student?.name ?? "student"}`}
        >
            {content}
        </Link>
    )
}

export const ApplicationsListTable = React.memo(function ApplicationsListTable({
    applications,
    role = "AGENT",
    isLoading,
    isError,
    onRetry,
    showPagination = true,
}: Props) {
    const isStudent = role === "STUDENT"
    const isAgent = role === "AGENT"
    const showStudentColumn = !isStudent
    const showAgentColumn = role === "UNIVERSITY"
    const showApplicationNoColumn = isStudent || isAgent
    const showExtendedProgramColumns = isStudent || isAgent

    const columnCount = useMemo(() => {
        if (isStudent) return 9
        if (isAgent) return 10
        if (showAgentColumn) return 7
        return 6
    }, [isStudent, isAgent, showAgentColumn])

    const tableMinWidth = isAgent ? "min-w-[1320px]" : "min-w-[1020px]"

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
                        Loading applications...
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
            <div className="overflow-x-auto rounded-xl">
                <Table className={cn("w-full text-left border-collapse", tableMinWidth)}>
                    <TableHeader className="sticky top-0 z-10">
                        <TableRow className="border-b-2 border-brand-secondary/20 bg-brand-secondary/10 hover:bg-brand-secondary/10">
                            {showApplicationNoColumn && (
                                <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                    Application No
                                </TableHead>
                            )}
                            {showStudentColumn && (
                                <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                    Student
                                </TableHead>
                            )}
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
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
                                    Agent
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
                                const studentName = app.student?.name ?? "—"
                                const initials = studentName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()

                                return (
                                    <TableRow
                                        key={app.id}
                                        className={cn(
                                            "border-b border-brand-secondary/15 transition-colors",
                                            index % 2 === 0 ? "bg-white/70" : "bg-white/45",
                                            "hover:bg-brand-secondary/5"
                                        )}
                                    >
                                        {showApplicationNoColumn && (
                                            <TableCell className="px-6 py-5 whitespace-nowrap">
                                                <Typography as="span" className="text-sm font-bold text-gray-900">
                                                    {getApplicationNumber(app)}
                                                </Typography>
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
                                                        <Typography as="span" className="text-sm font-bold text-gray-900">
                                                            {studentName}
                                                        </Typography>
                                                        {app.student?.student_code && (
                                                            <Typography as="span" className="text-[11px] text-gray-500 font-light">
                                                                {app.student.student_code}
                                                            </Typography>
                                                        )}
                                                        {app.student?.email && (
                                                            <Typography as="span" className="text-[11px] text-gray-500 font-light">
                                                                {app.student.email}
                                                            </Typography>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                        )}

                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <Typography as="span" className="text-sm font-bold text-gray-700">
                                                    {app.course?.name ?? "—"}
                                                </Typography>
                                                {app.course?.degree?.name && (
                                                    <Typography as="span" className="text-[11px] text-gray-500 font-light">
                                                        {app.course.degree.name}
                                                    </Typography>
                                                )}
                                            </div>
                                        </TableCell>

                                        {showExtendedProgramColumns && (
                                            <>
                                                <TableCell className="px-6 py-5 whitespace-nowrap">
                                                    <Typography as="span" className="text-sm font-medium text-gray-700">
                                                        {app.course?.degree?.fees ?? "Contact University"}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell className="px-6 py-5 whitespace-nowrap">
                                                    <Typography as="span" className="text-sm font-medium text-gray-600">
                                                        {formatIntakeDate(app.course?.degree?.intake_date)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell className="px-6 py-5 whitespace-nowrap">
                                                    <Typography as="span" className="text-sm font-medium text-gray-600">
                                                        {formatProgramDate(app.course?.deadline_date)}
                                                    </Typography>
                                                </TableCell>
                                            </>
                                        )}

                                        {showAgentColumn && (
                                            <TableCell className="px-6 py-5 whitespace-nowrap">
                                                <Typography as="span" className="text-sm font-light text-gray-600">
                                                    {app.agent?.name ?? "—"}
                                                </Typography>
                                            </TableCell>
                                        )}

                                        <TableCell className="px-6 py-5 whitespace-nowrap min-w-[140px]">
                                            <DocumentVaultCell app={app} />
                                        </TableCell>

                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex flex-col gap-1.5">
                                                <StatusBadge status={app.status} />
                                                {app.offer_shared && (
                                                    <StatusBadge
                                                        status={ApplicationStatus.CONDITIONAL_LETTER_ISSUED}
                                                    />
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            <Typography as="span" className="text-sm font-medium text-gray-600">
                                                {formatSubmittedDate(app.created_at)}
                                            </Typography>
                                        </TableCell>

                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            <Button
                                                variant="outline"
                                                className="h-9 px-6 bg-white/20 border-white/40 text-gray-700 hover:bg-white/40 rounded-lg font-bold text-[12px] transition-all shadow-sm"
                                                asChild
                                            >
                                                <Link href={`/dashboard/application/${app.id}`}>
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
                            <TableCell colSpan={columnCount} className="px-8 py-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center text-[12px] font-light text-gray-500 space-x-1">
                                        <Typography as="span" className="text-[12px] font-light text-gray-500">
                                            Showing
                                        </Typography>
                                        <Typography as="span" className="text-[12px] font-bold text-brand-blue-text mx-1">
                                            {applications.length}
                                        </Typography>
                                        <Typography as="span" className="text-[12px] font-light text-gray-500">
                                            entries
                                        </Typography>
                                    </div>

                                    {showPagination && (
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="icon">
                                                <ChevronLeft size={16} />
                                            </Button>
                                            <Button variant="outline" size="icon">
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
