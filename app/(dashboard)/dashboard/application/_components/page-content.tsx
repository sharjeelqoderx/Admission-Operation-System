"use client"

import { memo } from "react"
import Link from "next/link"
import { GraduationCap, FileText, Plus, RotateCcw, Search, CheckCircle2 } from "lucide-react"
import { Typography } from "@/components/shared/Typography"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { BluryCard } from "@/components/shared/blury-card"
import { DatePicker } from "@/components/shared/date-picker"
import { useDegrees, formatDegreeLabel } from "@/hooks/useDegrees"
import { ApplicationsListTable } from "./applications-list-table"
import { Role } from "@/types/enums/role"
import {
    withApplicationPageLogic,
    type ApplicationPageLogicProps,
} from "./withApplicationPageLogic"
import type { ApplicationDashboardPageData } from "@/types/schemas/application"

type PageContentProps = {
    initialData: ApplicationDashboardPageData
}

const ApplicationDashboardView = memo(function ApplicationDashboardView({
    role,
    canCreateApplication,
    showStudentSearch,
    applications,
    stats,
    isLoading,
    isFetching,
    isError,
    hasActiveFilters,
    q,
    searchInput,
    status,
    degreeId,
    dateFrom,
    dateTo,
    handleSearch,
    updateParams,
    handleResetFilters,
    handleRetry,
}: ApplicationPageLogicProps) {
    const { data: degrees = [], isLoading: degreesLoading } = useDegrees()

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-1 max-w-2xl">
                    <Typography as="h2" font="sub-heading" className="font-bold tracking-tight">
                        {role === Role.STUDENT ? "My Applications" : "All Applications"}
                    </Typography>
                    <Typography
                        as="p"
                        font="sub-text"
                        className="text-gray-500 font-medium max-w-2xl leading-relaxed"
                    >
                        {role === Role.STUDENT
                            ? "Track your submitted applications and their current status."
                            : "Track and manage all student applications submitted through your agency."}
                    </Typography>
                </div>
                {canCreateApplication && (
                    <Link href="/dashboard/application/new">
                        <Button className="px-6 gap-2 font-normal">
                            <Plus size={24} className="text-white" /> New Application
                        </Button>
                    </Link>
                )}
            </div>

            <div className="flex flex-col sm:flex-row gap-12 py-2">
                <div className="flex items-center gap-4">
                    <BluryCard
                        isCentered={false}
                        sharpCorners={[]}
                        blurAmount="backdrop-blur-2xl"
                        className="p-4"
                        childClass="md:p-0"
                    >
                        <GraduationCap className="size-6 text-gray-700" />
                    </BluryCard>
                    <div>
                        <Typography
                            as="p"
                            className="text-[12px] font-bold text-gray-500 uppercase tracking-wider"
                        >
                            Total Applications
                        </Typography>
                        <Typography
                            as="p"
                            className="text-[28px] font-extrabold text-gray-900 leading-none"
                        >
                            {isLoading || isFetching ? (
                                <span className="inline-block h-7 w-14 rounded bg-gray-200/60 animate-pulse align-middle" />
                            ) : (
                                stats.total
                            )}
                        </Typography>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <BluryCard
                        isCentered={false}
                        sharpCorners={[]}
                        blurAmount="backdrop-blur-2xl"
                        className="p-4"
                        childClass="md:p-0"
                    >
                        <FileText className="size-6 text-gray-700" />
                    </BluryCard>
                    <div>
                        <Typography
                            as="p"
                            className="text-[12px] font-bold text-gray-500 uppercase tracking-wider"
                        >
                            Pending
                        </Typography>
                        <Typography
                            as="p"
                            className="text-[28px] font-extrabold text-gray-900 leading-none"
                        >
                            {isLoading || isFetching ? (
                                <span className="inline-block h-7 w-14 rounded bg-gray-200/60 animate-pulse align-middle" />
                            ) : (
                                stats.pending
                            )}
                        </Typography>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <BluryCard
                        isCentered={false}
                        sharpCorners={[]}
                        blurAmount="backdrop-blur-2xl"
                        className="p-4"
                        childClass="md:p-0"
                    >
                        <CheckCircle2 className="size-6 text-gray-700" />
                    </BluryCard>
                    <div>
                        <Typography
                            as="p"
                            className="text-[12px] font-bold text-gray-500 uppercase tracking-wider"
                        >
                            Accepted
                        </Typography>
                        <Typography
                            as="p"
                            className="text-[28px] font-extrabold text-gray-900 leading-none"
                        >
                            {isLoading || isFetching ? (
                                <span className="inline-block h-7 w-14 rounded bg-gray-200/60 animate-pulse align-middle" />
                            ) : (
                                stats.accepted
                            )}
                        </Typography>
                    </div>
                </div>
            </div>

            <div className="flex flex-nowrap items-center gap-3 overflow-x-auto p-1">
                {showStudentSearch && (
                    <div className="relative min-w-[220px] flex-1">
                        <Search className="absolute left-3 top-1/2 z-10 -translate-y-1/2 size-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search by student name or ID"
                            className="w-full backdrop-blur-md ps-9"
                            value={searchInput}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>
                )}

                <Select value={status} onValueChange={(value) => updateParams({ status: value })}>
                    <SelectTrigger className="w-[160px] shrink-0">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="NEEDS_REVISION">Needs revision</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={degreeId}
                    onValueChange={(value) => updateParams({ degree_id: value })}
                    disabled={degreesLoading}
                >
                    <SelectTrigger className="w-[200px] shrink-0">
                        <SelectValue placeholder={degreesLoading ? "Loading..." : "Degree"} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All degrees</SelectItem>
                        {degrees.map((degree) => (
                            <SelectItem key={degree.id} value={degree.id}>
                                {formatDegreeLabel(degree)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <DatePicker
                    value={dateFrom}
                    onChange={(value) => updateParams({ date_from: value })}
                    placeholder="From date"
                    className="w-[160px] shrink-0 h-10 text-xs"
                />

                <DatePicker
                    value={dateTo}
                    onChange={(value) => updateParams({ date_to: value })}
                    placeholder="To date"
                    className="w-[160px] shrink-0 h-10 text-xs"
                />

                {hasActiveFilters && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleResetFilters}
                        className="shrink-0 h-10 gap-2 border-white/40 bg-white/20 hover:bg-white/40"
                    >
                        <RotateCcw className="size-4" />
                        Reset
                    </Button>
                )}
            </div>

            <ApplicationsListTable
                applications={applications}
                role={role}
                isLoading={isLoading}
                isFetching={isFetching}
                isError={isError}
                onRetry={handleRetry}
            />
        </div>
    )
})

const ApplicationDashboardPageContent = memo(withApplicationPageLogic(ApplicationDashboardView))
ApplicationDashboardPageContent.displayName = "ApplicationDashboardPageContent"

export function PageContent({ initialData }: PageContentProps) {
    return <ApplicationDashboardPageContent initialData={initialData} />
}
