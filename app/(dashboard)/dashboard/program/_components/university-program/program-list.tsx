"use client"

import { memo, useState } from "react"
import Link from "next/link"
import { Clock, MapPin, ChevronLeft, ChevronRight, Trash2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Typography } from "@/components/shared/Typography"
import { PageLoader } from "@/components/shared/page-loader"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import type {
    UniversityProgramListItem,
    UniversityProgramListResponse,
} from "@/types/schemas/university-program"

type UniversityProgramListCardProps = {
    program: UniversityProgramListItem
    canManagePrograms: boolean
    isDeleting: boolean
    onDelete: (id: string) => void
}

function formatTimestamp(value: string) {
    return new Date(value).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    })
}

export const UniversityProgramListCard = memo(function UniversityProgramListCard({
    program,
    canManagePrograms,
    isDeleting,
    onDelete,
}: UniversityProgramListCardProps) {
    const [deleteOpen, setDeleteOpen] = useState(false)
    const metaParts = [
        program.level_name,
        program.intake_label,
        program.deadline_label ? `Deadline: ${program.deadline_label}` : null,
    ].filter(Boolean)

    const tuitionLabel = program.tuition_fees
        ? program.tuition_fees.toLowerCase().includes("tuition")
            ? program.tuition_fees
            : `Tuition Fees ${program.tuition_fees}`
        : null

    return (
        <Card className="relative border-none bg-white/80 px-5 py-6 shadow-sm ring-1 ring-black/5 backdrop-blur-lg">
            {canManagePrograms ? (
                <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-4 top-4 z-10"
                    aria-label={`Delete ${program.name}`}
                    disabled={isDeleting}
                    onClick={() => setDeleteOpen(true)}
                >
                    <Trash2 />
                </Button>
            ) : null}

            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1 space-y-4 pr-12">
                    <Typography as="p" font="sub-text" className="text-gray-500">
                        {metaParts.join(" • ")}
                    </Typography>

                    <div className="space-y-1">
                        <Typography as="h3" font="title" className="font-bold text-brand-primary">
                            {program.name}
                        </Typography>
                        {program.category ? (
                            <Typography as="p" font="text" className="font-semibold text-brand-primary">
                                {program.category}
                            </Typography>
                        ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-5">
                        {program.location ? (
                            <div className="flex items-center gap-2">
                                <MapPin className="size-4 text-gray-500" />
                                <Typography as="span" font="sub-text" className="text-gray-700">
                                    {program.location}
                                </Typography>
                            </div>
                        ) : null}
                        {program.duration ? (
                            <div className="flex items-center gap-2">
                                <Clock className="size-4 text-gray-500" />
                                <Typography as="span" font="sub-text" className="text-gray-700">
                                    {program.duration}
                                </Typography>
                            </div>
                        ) : null}
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-1">
                        {/* <Typography as="span" font="small" className="text-gray-500">
                            Created: {formatTimestamp(program.created_at)}
                        </Typography> */}
                        <Typography as="span" font="small" className="text-gray-500">
                            Last Updated: {formatTimestamp(program.updated_at)}
                        </Typography>
                    </div>
                </div>

                <div
                    className={`flex w-full flex-col items-stretch gap-4 lg:w-[280px] lg:items-end ${
                        canManagePrograms ? "pt-12" : ""
                    }`}
                >
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                        {tuitionLabel ? (
                            <Typography
                                as="span"
                                font="small"
                                className="rounded-xl bg-brand-blue/10 px-3 py-2 font-semibold text-brand-blue"
                            >
                                {tuitionLabel}
                            </Typography>
                        ) : null}
                        {program.agent_commission != null ? (
                            <Typography
                                as="span"
                                font="small"
                                className="rounded-xl bg-brand-success/10 px-3 py-2 font-semibold text-brand-success"
                            >
                                {program.agent_commission}% Commission
                            </Typography>
                        ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 lg:justify-end lg:self-end">
                        <Link
                            href={`/dashboard/program/${program.id}`}
                            className="inline-flex h-11 min-w-[110px] items-center justify-center rounded-xl border border-white/80 bg-white/60 px-6 font-bold text-brand-primary shadow-sm backdrop-blur-md transition-colors hover:bg-white/80"
                        >
                            <Typography as="span" font="text" className="font-bold text-brand-primary">
                                View
                            </Typography>
                        </Link>
                        {canManagePrograms ? (
                            <Link
                                href={`/dashboard/program/${program.id}/edit`}
                                className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-byzantine px-6 font-semibold text-white shadow-sm transition-colors hover:bg-brand-byzantine/90"
                            >
                                <Typography as="span" font="text" className="font-semibold text-white">
                                    Edit Program
                                </Typography>
                            </Link>
                        ) : null}
                    </div>
                </div>
            </div>

            {canManagePrograms ? (
                <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                    <DialogContent showCloseButton={!isDeleting}>
                        <DialogHeader>
                            <DialogTitle asChild>
                                <Typography as="h2" font="title">
                                    Delete program?
                                </Typography>
                            </DialogTitle>
                            <DialogDescription asChild>
                                <Typography as="p" font="sub-text">
                                    {`"${program.name}" will be removed from program listings. Existing historical records will remain intact.`}
                                </Typography>
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={isDeleting}
                                onClick={() => setDeleteOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                disabled={isDeleting}
                                onClick={() => onDelete(program.id)}
                            >
                                {isDeleting ? "Deleting..." : "Delete Program"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            ) : null}
        </Card>
    )
})

export type UniversityProgramListProps = {
    programs: UniversityProgramListItem[]
    pagination: UniversityProgramListResponse["pagination"]
    isLoading?: boolean
    deletingId: string | null
    canManagePrograms: boolean
    onPageChange: (page: number) => void
    onDelete: (id: string) => void
}

export const UniversityProgramList = memo<UniversityProgramListProps>(function UniversityProgramList({
    programs,
    pagination,
    isLoading = false,
    deletingId,
    canManagePrograms,
    onPageChange,
    onDelete,
}: UniversityProgramListProps) {
    if (isLoading) {
        return <PageLoader className="py-12" />
    }

    if (programs.length === 0) {
        return (
            <Typography as="p" font="sub-text" className="py-12 text-center text-gray-500">
                No programs found.
            </Typography>
        )
    }

    return (
        <div className="space-y-5">
            {programs.map((program) => (
                <UniversityProgramListCard
                    key={program.id}
                    program={program}
                    canManagePrograms={canManagePrograms}
                    isDeleting={deletingId === program.id}
                    onDelete={onDelete}
                />
            ))}

            <div className="flex items-center justify-between pt-2">
                <Typography as="span" font="sub-text" className="text-gray-500">
                    Showing {programs.length} of {pagination.total.toLocaleString()} programs
                </Typography>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        disabled={pagination.page <= 1}
                        onClick={() => onPageChange(pagination.page - 1)}
                        className="flex size-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40"
                    >
                        <ChevronLeft className="size-4" />
                    </button>
                    <button
                        type="button"
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => onPageChange(pagination.page + 1)}
                        className="flex size-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40"
                    >
                        <ChevronRight className="size-4" />
                    </button>
                </div>
            </div>
        </div>
    )
})
