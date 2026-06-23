"use client"

import { withApplicationDetailLogic } from "./withApplicationDetailLogic"
import { ApplicationDetailView } from "./detail-view"
import type { ApplicationDetailPageData } from "@/types/schemas/application"

const ApplicationDetailPageContent = withApplicationDetailLogic(ApplicationDetailView)

type PageContentProps = {
    applicationId: string
    initialData: ApplicationDetailPageData
}

export function PageContent({ applicationId, initialData }: PageContentProps) {
    return (
        <ApplicationDetailPageContent applicationId={applicationId} initialData={initialData} />
    )
}
