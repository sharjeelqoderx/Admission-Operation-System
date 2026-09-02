"use client"

import { memo } from "react"
import { Typography } from "@/components/shared/Typography"
import { UniversityStudentStatsCards } from "./stats-cards"
import { UniversityStudentListTable } from "./student-list-table"
import { withUniversityStudentPageLogic } from "./withUniversityStudentPageLogic"
import type { UniversityStudentListResponse } from "@/types/schemas/university-student"

type UniversityStudentPageViewProps = {
    overview: UniversityStudentListResponse
    searchValue: string
    statusValue: string
    isLoading: boolean
    isFetching: boolean
    onSearchChange: (value: string) => void
    onStatusChange: (value: string) => void
    onPageChange: (page: number) => void
}

const UniversityStudentPageView = memo(function UniversityStudentPageView({
    overview,
    searchValue,
    statusValue,
    isLoading,
    isFetching,
    onSearchChange,
    onStatusChange,
    onPageChange,
}: UniversityStudentPageViewProps) {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="max-w-4xl space-y-2">
                <Typography as="h2" font="sub-heading" className="font-bold tracking-tight text-brand-primary">
                    Global Recruitment Overview
                </Typography>
                <Typography as="p" font="sub-text" className="max-w-3xl leading-relaxed text-gray-500">
                    Quarterly performance analysis for FHM International recruitment pipeline. Monitor
                    conversion metrics and institutional growth across all global territories.
                </Typography>
            </div>

            <UniversityStudentStatsCards stats={overview.stats} />

            <UniversityStudentListTable
                students={overview.data}
                pagination={overview.pagination}
                isLoading={isLoading}
                isFetching={isFetching}
                searchValue={searchValue}
                statusValue={statusValue}
                onSearchChange={onSearchChange}
                onStatusChange={onStatusChange}
                onPageChange={onPageChange}
            />
        </div>
    )
})

const UniversityStudentPageContent = withUniversityStudentPageLogic(UniversityStudentPageView)

type PageContentProps = {
    initialOverview: UniversityStudentListResponse
}

export function UniversityStudentListPageContent({ initialOverview }: PageContentProps) {
    return <UniversityStudentPageContent initialOverview={initialOverview} />
}
