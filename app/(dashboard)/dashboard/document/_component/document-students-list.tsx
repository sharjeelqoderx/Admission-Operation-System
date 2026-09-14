"use client"

import { memo } from "react"
import { RotateCcw } from "lucide-react"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { Button } from "@/components/ui/button"
import { DocumentTable } from "./DocumentTable"
import { DocumentStatusFilter } from "./document-status-filter"
import { DocumentStudentSearch } from "./document-student-search"
import {
    withDocumentStudentsListLogic,
    type DocumentStudentsListLogicProps,
} from "./withDocumentStudentsListLogic"

export const DocumentStudentsListView = memo(function DocumentStudentsListView({
    title = "All Documents",
    description = "Select a student to view programs and upload required documents to their profile.",
    rows,
    pagination,
    page,
    isLoading,
    isFetching,
    isError,
    searchInput,
    status,
    hasActiveFilters,
    onRetry,
    handleSearch,
    updateParams,
    handleResetFilters,
    handlePageChange,
    getViewHref,
}: DocumentStudentsListLogicProps) {
    return (
        <div className="space-y-6">
            <BluryCard isCentered={false} childClass="space-y-2" className="rounded-2xl">
                <Typography as="h2" font="sub-heading" className="font-bold tracking-tight">
                    {title}
                </Typography>
                <Typography as="p" font="sub-text" className="text-gray-600">
                    {description}
                </Typography>
            </BluryCard>

            <div className="flex flex-nowrap items-center gap-3 overflow-x-auto p-1">
                <DocumentStudentSearch value={searchInput} onChange={handleSearch} />

                <DocumentStatusFilter
                    value={status}
                    onValueChange={(value) => updateParams({ status: value })}
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

            <DocumentTable
                rows={rows}
                pagination={pagination}
                page={page}
                isLoading={isLoading}
                isFetching={isFetching}
                isError={isError}
                onRetry={onRetry}
                onPageChange={handlePageChange}
                getViewHref={getViewHref}
            />
        </div>
    )
})

export const DocumentStudentsList = withDocumentStudentsListLogic(DocumentStudentsListView)
