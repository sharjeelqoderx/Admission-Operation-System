"use client"

import { memo } from "react"
import { RotateCcw } from "lucide-react"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { Button } from "@/components/ui/button"
import { AllDocumentsTable } from "./all-documents-table"
import { RejectDocumentDialog } from "./reject-document-dialog"
import { DocumentStatusFilter } from "../document-status-filter"
import { DocumentStudentSearch } from "../document-student-search"
import { withAllDocumentsLogic } from "./withAllDocumentsLogic"
import type { AllDocumentsPageLogicProps } from "./withAllDocumentsLogic"

export const AllDocumentsPageContent = memo(function AllDocumentsPageContent({
    rows,
    isLoading,
    isFetching,
    isError,
    q,
    searchInput,
    status,
    hasActiveFilters,
    reviewingDocumentId,
    rejectDialogOpen,
    rejectTarget,
    rejectErrorMessage,
    isRejectSubmitting,
    onRetry,
    handleSearch,
    updateParams,
    handleResetFilters,
    onApprove,
    onRejectRequest,
    onRejectDialogOpenChange,
    onRejectSubmit,
}: AllDocumentsPageLogicProps) {
    return (
        <div className="space-y-6">
            <BluryCard isCentered={false} childClass="space-y-2" className="rounded-2xl">
                <Typography as="h2" font="sub-heading" className="font-bold tracking-tight">
                    View All Documents
                </Typography>
                <Typography as="p" font="sub-text" className="text-gray-600">
                    Review, approve, or reject all uploaded student documents in one place.
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

            <AllDocumentsTable
                rows={rows}
                isLoading={isLoading}
                isFetching={isFetching}
                isError={isError}
                statusFilter={status}
                searchFilter={q}
                reviewingDocumentId={reviewingDocumentId}
                onRetry={onRetry}
                onApprove={onApprove}
                onReject={onRejectRequest}
            />

            <RejectDocumentDialog
                open={rejectDialogOpen}
                documentName={rejectTarget?.document_name ?? "Document"}
                isSubmitting={isRejectSubmitting}
                errorMessage={rejectErrorMessage}
                onOpenChange={onRejectDialogOpenChange}
                onSubmit={onRejectSubmit}
            />
        </div>
    )
})

export const AllDocumentsDashboardPage = withAllDocumentsLogic(AllDocumentsPageContent)
