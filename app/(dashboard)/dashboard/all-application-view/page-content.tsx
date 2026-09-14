"use client"

import { memo, Suspense } from "react"
import { GraduationCap, FileText, RotateCcw, Search, CheckCircle2 } from "lucide-react"
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
import { ListPageSkeleton } from "@/components/shared/page-skeleton"
import { useDegrees, formatDegreeLabel } from "@/hooks/useDegrees"
import { ApplicationsListTable } from "@/app/(dashboard)/dashboard/application/_components/applications-list-table"
import { Role } from "@/types/enums/role"
import {
    withAllApplicationViewLogic,
    type AllApplicationViewLogicProps,
} from "./withAllApplicationViewLogic"
import type { ApplicationDashboardPageData } from "@/types/schemas/application"

type PageContentProps = {
    initialData?: ApplicationDashboardPageData
}

const AllApplicationView = memo(function AllApplicationView({
    role,
    applications,
    pagination,
    stats,
    isLoading,
    isFetching,
    isError,
    hasActiveFilters,
    q,
    status,
    degreeId,
    dateFrom,
    dateTo,
    handleSearch,
    handlePageChange,
    updateParams,
    handleResetFilters,
    handleRetry,
}: AllApplicationViewLogicProps) {
    const { data: degrees = [], isLoading: degreesLoading } = useDegrees()

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-1 max-w-2xl">
                    <Typography as="h2" font="sub-heading" className="font-bold tracking-tight">
                        All Application View
                    </Typography>
                    <Typography
                        as="p"
                        font="sub-text"
                        className="text-gray-500 font-medium max-w-2xl leading-relaxed"
                    >
                        Browse every student application in the system and create offers from your
                        saved templates.
                    </Typography>
                </div>
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
                            {isLoading ? (
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
                            {isLoading ? (
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
                            {isLoading ? (
                                <span className="inline-block h-7 w-14 rounded bg-gray-200/60 animate-pulse align-middle" />
                            ) : (
                                stats.accepted
                            )}
                        </Typography>
                    </div>
                </div>
            </div>

            <div className="flex flex-nowrap items-center gap-3 overflow-x-auto p-1">
                {role !== Role.STUDENT && (
                    <div className="relative min-w-[220px] flex-1">
                        <Search className="absolute left-3 top-1/2 z-10 -translate-y-1/2 size-4 text-gray-400" />
                        <Input
                            key={q}
                            type="text"
                            placeholder="Search student name or email"
                            className="w-full backdrop-blur-md ps-9"
                            defaultValue={q}
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
                pagination={pagination}
                isLoading={isLoading}
                isFetching={isFetching}
                isError={isError}
                onRetry={handleRetry}
                onPageChange={handlePageChange}
                viewBasePath="/dashboard/all-application-view"
            />
        </div>
    )
})

const AllApplicationViewContent = withAllApplicationViewLogic(AllApplicationView)

export function PageContent({ initialData }: PageContentProps) {
    return (
        <Suspense fallback={<ListPageSkeleton />}>
            <AllApplicationViewContent initialData={initialData} />
        </Suspense>
    )
}
