"use client"

import { memo } from "react"
import { Typography } from "@/components/shared/Typography"
import { UniversityApplicationListTable } from "./application-list-table"
import { withUniversityApplicationPageLogic } from "./withUniversityApplicationPageLogic"
import { RejectApplicationDialog } from "@/app/(dashboard)/dashboard/application/_components/reject-application-dialog"
import { DeferIntakeDialog } from "@/app/(dashboard)/dashboard/application/_components/defer-intake-dialog"
import { MissingOfferTemplateAlert } from "@/app/(dashboard)/dashboard/all-application-view/_component/missing-offer-template-alert"
import type {
    UniversityApplicationListResponse,
} from "@/types/schemas/university-application"
import type {
    UniversityApplicationInitialQuery,
    UniversityApplicationPageLogicProps,
} from "./withUniversityApplicationPageLogic"

const UniversityApplicationPageView = memo(function UniversityApplicationPageView({
    overview,
    searchValue,
    activeTab,
    isFetching,
    reviewingApplicationId,
    rejectDialogOpen,
    rejectTarget,
    isRejectSubmitting,
    rejectErrorMessage,
    deferDialogOpen,
    deferTarget,
    isDeferSubmitting,
    deferErrorMessage,
    missingTemplateAlert,
    isCreatingOfferWithoutTemplate,
    onSearchChange,
    onTabChange,
    onTabHover,
    onPageChange,
    onApprove,
    onRejectRequest,
    onDeferRequest,
    onRejectDialogOpenChange,
    onRejectSubmit,
    onDeferDialogOpenChange,
    onDeferSubmit,
    onCreateOfferWithoutTemplate,
    onMissingTemplateAlertOpenChange,
}: UniversityApplicationPageLogicProps) {
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
                isFetching={isFetching}
                searchValue={searchValue}
                activeTab={activeTab}
                reviewingApplicationId={reviewingApplicationId}
                onSearchChange={onSearchChange}
                onTabChange={onTabChange}
                onTabHover={onTabHover}
                onPageChange={onPageChange}
                onApprove={onApprove}
                onRejectRequest={onRejectRequest}
                onDeferRequest={onDeferRequest}
            />

            <DeferIntakeDialog
                open={deferDialogOpen}
                studentName={deferTarget?.student_name ?? "this student"}
                currentIntake={deferTarget?.intake_label ?? null}
                isSubmitting={isDeferSubmitting}
                errorMessage={deferErrorMessage ?? null}
                onOpenChange={onDeferDialogOpenChange}
                onSubmit={onDeferSubmit}
            />

            <RejectApplicationDialog
                open={rejectDialogOpen}
                studentName={rejectTarget?.student_name ?? "this student"}
                isSubmitting={isRejectSubmitting}
                errorMessage={rejectErrorMessage}
                onOpenChange={onRejectDialogOpenChange}
                onSubmit={onRejectSubmit}
            />

            <MissingOfferTemplateAlert
                open={missingTemplateAlert.open}
                title={missingTemplateAlert.title}
                description={missingTemplateAlert.description}
                allowCreateWithoutTemplate={missingTemplateAlert.allowCreateWithoutTemplate}
                isCreatingWithoutTemplate={isCreatingOfferWithoutTemplate}
                onCreateWithoutTemplate={onCreateOfferWithoutTemplate}
                onOpenChange={onMissingTemplateAlertOpenChange}
            />
        </div>
    )
})

const UniversityApplicationPageContent = withUniversityApplicationPageLogic(
    UniversityApplicationPageView
)

type PageContentProps = {
    initialOverview?: UniversityApplicationListResponse
    initialQuery?: UniversityApplicationInitialQuery
}

export function UniversityApplicationListPageContent({
    initialOverview,
    initialQuery,
}: PageContentProps) {
    return (
        <UniversityApplicationPageContent
            initialOverview={initialOverview}
            initialQuery={initialQuery}
        />
    )
}
