"use client"

import { memo, Suspense } from "react"
import { Search } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { Input } from "@/components/ui/input"
import { PageLoader } from "@/components/shared/page-loader"
import { OfferTable } from "./_component/OfferTable"
import { OfferStatusFilter } from "./_component/offer-status-filter"
import { OfferProgramFilter } from "./_component/offer-program-filter"
import { withOfferPageLogic, type OfferPageLogicProps } from "./withOfferPageLogic"
import type { OfferDashboardPageData } from "@/types/schemas/offer"
import type { CourseProgram } from "@/types/schemas/program"

const OfferPageView = memo(function OfferPageView({
    offers,
    pagination,
    isLoading,
    isFetching,
    isError,
    searchInput,
    status,
    courseId,
    handleSearch,
    updateParams,
    handlePageChange,
    handleRetry,
}: OfferPageLogicProps) {
    const { data: programsResponse, isLoading: programsLoading } = useQuery({
        queryKey: ["programs", "offer-filter"],
        queryFn: async () => {
            const res = await fetch("/api/program?limit=100")
            if (!res.ok) throw new Error("Failed to fetch programs")
            return res.json() as Promise<{ data: CourseProgram[] }>
        },
        staleTime: 60_000,
    })

    const programs = Array.isArray(programsResponse?.data) ? programsResponse.data : []

    return (
        <main className="relative space-y-6">
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                blendColorClass="bg-white/10"
                childClass="space-y-4"
            >
                <div className="space-y-1 max-w-2xl">
                    <Typography as="h2" font="sub-heading" className="font-bold tracking-tight">
                        All offers
                    </Typography>
                    <Typography as="p" font="sub-text" className="text-gray-500 font-medium max-w-2xl leading-relaxed">
                        Review and manage offer letters across students and programs.
                    </Typography>
                </div>
            </BluryCard>

            <div className="flex flex-nowrap items-center gap-3 overflow-x-auto p-1">
                <div className="relative min-w-[220px] flex-1 max-w-xl">
                    <Search className="absolute left-3 top-1/2 z-10 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search by student name or program..."
                        className="w-full backdrop-blur-md ps-9 bg-white/20 border-white/40 focus:bg-white/40 transition-all"
                        value={searchInput}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>

                <OfferStatusFilter
                    value={status}
                    onValueChange={(value) => updateParams({ status: value })}
                />

                <OfferProgramFilter
                    value={courseId}
                    onValueChange={(value) => updateParams({ course_id: value })}
                    programs={programs}
                    isLoading={programsLoading}
                />
            </div>

            <OfferTable
                offers={offers}
                pagination={pagination}
                isLoading={isLoading}
                isFetching={isFetching}
                isError={isError}
                onRetry={handleRetry}
                onPageChange={handlePageChange}
            />
        </main>
    )
})

const OfferPageContent = withOfferPageLogic(OfferPageView)

type PageContentProps = {
    initialData: OfferDashboardPageData
}

export function PageContent({ initialData }: PageContentProps) {
    return (
        <Suspense fallback={<PageLoader />}>
            <OfferPageContent initialData={initialData} />
        </Suspense>
    )
}
