"use client"

import { memo } from "react"
import Link from "next/link"
import { Clock, MapPin, ChevronLeft, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Typography } from "@/components/shared/Typography"
import { PageLoader } from "@/components/shared/page-loader"
import type {
    UniversityProgramListItem,
    UniversityProgramListResponse,
} from "@/types/schemas/university-program"

type UniversityProgramListCardProps = {
    program: UniversityProgramListItem
    viewOnly?: boolean
}

export const UniversityProgramListCard = memo(function UniversityProgramListCard({
    program,
    viewOnly = false,
}: UniversityProgramListCardProps) {
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
        <Card className="border-none bg-white/80 px-5 py-6 shadow-sm ring-1 ring-black/5 backdrop-blur-lg">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1 space-y-4">
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
                </div>

                <div className="flex w-full flex-col items-stretch gap-4 lg:w-[280px] lg:items-end">
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
                        {!viewOnly ? (
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
        </Card>
    )
})

type UniversityProgramListProps = {
    programs: UniversityProgramListItem[]
    pagination: UniversityProgramListResponse["pagination"]
    isLoading?: boolean
    onPageChange: (page: number) => void
    viewOnly?: boolean
}

export const UniversityProgramList = memo(function UniversityProgramList({
    programs,
    pagination,
    isLoading = false,
    onPageChange,
    viewOnly = false,
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
                <UniversityProgramListCard key={program.id} program={program} viewOnly={viewOnly} />
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
