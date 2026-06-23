"use client"

import { memo } from "react"
import { Typography } from "@/components/shared/Typography"
import { UniversityApplicationListTable } from "./application-list-table"
import { withUniversityApplicationPageLogic } from "./withUniversityApplicationPageLogic"
import type {
    UniversityApplicationListResponse,
    UniversityApplicationTab,
} from "@/types/schemas/university-application"

type UniversityApplicationPageViewProps = {
    overview: UniversityApplicationListResponse
    searchValue: string
    activeTab: UniversityApplicationTab
    isFetching: boolean
    onSearchChange: (value: string) => void
    onTabChange: (value: UniversityApplicationTab) => void
    onPageChange: (page: number) => void
}

const UniversityApplicationPageView = memo(function UniversityApplicationPageView({
    overview,
    searchValue,
    activeTab,
    isFetching,
    onSearchChange,
    onTabChange,
    onPageChange,
}: UniversityApplicationPageViewProps) {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="max-w-4xl space-y-2">
                <Typography as="h2" font="sub-heading" className="font-bold tracking-tight text-brand-primary">
                    All Application
                </Typography>
                <Typography as="p" font="sub-text" className="max-w-3xl leading-relaxed text-gray-500">
                    Manage international student intake, review documentation status, and track university partner
                    performance across all global programs.
                </Typography>
            </div>

            <UniversityApplicationListTable
                applications={overview.data}
                tabCounts={overview.tab_counts}
                pagination={overview.pagination}
                isLoading={isFetching}
                searchValue={searchValue}
                activeTab={activeTab}
                onSearchChange={onSearchChange}
                onTabChange={onTabChange}
                onPageChange={onPageChange}
            />
        </div>
    )
})

const UniversityApplicationPageContent = withUniversityApplicationPageLogic(UniversityApplicationPageView)

type PageContentProps = {
    initialOverview: UniversityApplicationListResponse
}

export function UniversityApplicationListPageContent({ initialOverview }: PageContentProps) {
    return <UniversityApplicationPageContent initialOverview={initialOverview} />
}
