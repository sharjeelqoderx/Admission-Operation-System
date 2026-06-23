"use client"

import { memo } from "react"
import Link from "next/link"
import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Typography } from "@/components/shared/Typography"
import { UniversityProgramList } from "./program-list"
import { withUniversityProgramPageLogic } from "./withUniversityProgramPageLogic"
import type { UniversityProgramListResponse } from "@/types/schemas/university-program"

type UniversityProgramPageViewProps = {
    overview: UniversityProgramListResponse
    searchValue: string
    isFetching: boolean
    onSearchChange: (value: string) => void
    onPageChange: (page: number) => void
}

const UniversityProgramPageView = memo(function UniversityProgramPageView({
    overview,
    searchValue,
    isFetching,
    onSearchChange,
    onPageChange,
}: UniversityProgramPageViewProps) {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl space-y-2">
                    <Typography as="h2" font="sub-heading" className="font-bold tracking-tight text-brand-primary">
                        All Programs
                    </Typography>
                    <Typography as="p" font="sub-text" className="leading-relaxed text-gray-500">
                        Manage your academic catalog, tuition details, and agent commission settings across
                        all active and historical programs.
                    </Typography>
                </div>

                <Link href="/dashboard/program/new">
                    <Button className="h-11 rounded-xl bg-white px-5 font-semibold text-brand-primary shadow-sm ring-1 ring-black/5 hover:bg-gray-50">
                        <Plus className="mr-2 size-4" />
                        Add New Program
                    </Button>
                </Link>
            </div>

            <div className="relative max-w-xl">
                <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <Input
                    value={searchValue}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder="Search program"
                    className="h-12 border-none bg-white pl-11 shadow-sm ring-1 ring-black/5"
                />
            </div>

            <UniversityProgramList
                programs={overview.data}
                pagination={overview.pagination}
                isLoading={isFetching}
                onPageChange={onPageChange}
            />
        </div>
    )
})

const UniversityProgramPageContent = withUniversityProgramPageLogic(UniversityProgramPageView)

type PageContentProps = {
    initialOverview: UniversityProgramListResponse
}

export function UniversityProgramListPageContent({ initialOverview }: PageContentProps) {
    return <UniversityProgramPageContent initialOverview={initialOverview} />
}
