"use client"

import { memo } from "react"
import { Typography } from "@/components/shared/Typography"
import { UniversityAgentStatsCards } from "./stats-cards"
import { UniversityAgentListTable } from "./agent-list-table"
import { withUniversityAgentPageLogic } from "./withUniversityAgentPageLogic"
import type { UniversityAgentListResponse } from "@/types/schemas/university-agent"

type UniversityAgentPageViewProps = {
    overview: UniversityAgentListResponse
    statusValue: string
    countryValue: string
    sortBy: string
    activeTab: string
    isFetching: boolean
    onStatusChange: (value: string) => void
    onCountryChange: (value: string) => void
    onSortByChange: (value: string) => void
    onTabChange: (value: string) => void
    onPageChange: (page: number) => void
    allCountries: string[]
}

const UniversityAgentPageView = memo(function UniversityAgentPageView({
    overview,
    statusValue,
    countryValue,
    sortBy,
    activeTab,
    isFetching,
    onStatusChange,
    onCountryChange,
    onSortByChange,
    onTabChange,
    onPageChange,
    allCountries,
}: UniversityAgentPageViewProps) {
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

            <UniversityAgentStatsCards stats={overview.stats} />

            <UniversityAgentListTable
                agents={overview.data}
                pagination={overview.pagination}
                isLoading={isFetching}
                statusValue={statusValue}
                countryValue={countryValue}
                sortBy={sortBy}
                activeTab={activeTab}
                onStatusChange={onStatusChange}
                onCountryChange={onCountryChange}
                onSortByChange={onSortByChange}
                onTabChange={onTabChange}
                onPageChange={onPageChange}
                allCountries={allCountries}
            />
        </div>
    )
})

const UniversityAgentPageContent = withUniversityAgentPageLogic(UniversityAgentPageView)

type PageContentProps = {
    initialOverview: UniversityAgentListResponse
}

export function UniversityAgentListPageContent({ initialOverview }: PageContentProps) {
    return <UniversityAgentPageContent initialOverview={initialOverview} />
}
