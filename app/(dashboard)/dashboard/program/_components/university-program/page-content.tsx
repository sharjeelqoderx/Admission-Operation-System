"use client"

import { memo } from "react"
import Link from "next/link"
import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Typography } from "@/components/shared/Typography"
import { UniversityProgramList as ProgramList } from "./program-list"
import { ProgramLevelFilter } from "./program-level-filter"
import { withUniversityProgramPageLogic } from "./withUniversityProgramPageLogic"
import type { UniversityProgramListResponse } from "@/types/schemas/university-program"

type UniversityProgramPageViewProps = {
    overview: UniversityProgramListResponse
    canManagePrograms: boolean
    searchValue: string
    levelId: string
    isLoading: boolean
    isFetching: boolean
    deletingId: string | null
    onSearchChange: (value: string) => void
    onLevelChange: (value: string) => void
    onPageChange: (page: number) => void
    onDelete: (id: string) => void
}

const UniversityProgramPageView = memo(function UniversityProgramPageView({
    overview,
    canManagePrograms,
    searchValue,
    levelId,
    isLoading,
    isFetching,
    deletingId,
    onSearchChange,
    onLevelChange,
    onPageChange,
    onDelete,
}: UniversityProgramPageViewProps) {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl space-y-2">
                    <Typography as="h2" font="sub-heading" className="font-bold tracking-tight text-brand-primary">
                        All Programs
                    </Typography>
                    <Typography as="p" font="sub-text" className="leading-relaxed text-gray-500">
                        Manage your academic catalog, tuition details, and university partner commission settings across
                        all active and historical programs.
                    </Typography>
                </div>

                {canManagePrograms ? (
                    <Button asChild variant="default" size="default">
                        <Link href="/dashboard/program/new">
                            <Plus />
                            Add New Program
                        </Link>
                    </Button>
                ) : null}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative max-w-xl flex-1">
                    <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        value={searchValue}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder="Search program"
                        className="h-12 border-none bg-white pl-11 shadow-sm ring-1 ring-black/5"
                    />
                </div>
                <ProgramLevelFilter value={levelId} onValueChange={onLevelChange} />
            </div>

            <ProgramList
                programs={overview.data}
                pagination={overview.pagination}
                isLoading={isLoading}
                isFetching={isFetching}
                deletingId={deletingId}
                canManagePrograms={canManagePrograms}
                onPageChange={onPageChange}
                onDelete={onDelete}
            />
        </div>
    )
})

const UniversityProgramPageContent = withUniversityProgramPageLogic(UniversityProgramPageView)

type PageContentProps = {
    initialOverview?: UniversityProgramListResponse
    canManagePrograms: boolean
}

export function UniversityProgramListPageContent({
    initialOverview,
    canManagePrograms,
}: PageContentProps) {
    return (
        <UniversityProgramPageContent
            initialOverview={initialOverview}
            canManagePrograms={canManagePrograms}
        />
    )
}
