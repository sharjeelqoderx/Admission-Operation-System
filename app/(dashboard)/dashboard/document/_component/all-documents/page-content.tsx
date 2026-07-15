"use client"

import { memo } from "react"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { AllDocumentsTable } from "./all-documents-table"
import { RejectDocumentDialog } from "./reject-document-dialog"
import type { AllDocumentsPageLogicProps } from "./withAllDocumentsLogic"

export const AllDocumentsPageContent = memo(function AllDocumentsPageContent({
    rows,
    isLoading,
    isError,
    reviewingDocumentId,
    rejectDialogOpen,
    rejectTarget,
    rejectErrorMessage,
    isRejectSubmitting,
    onRetry,
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

            <AllDocumentsTable
                rows={rows}
                isLoading={isLoading}
                isError={isError}
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
