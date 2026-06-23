"use client"

import { withUniversityApplicationDetailLogic } from "./withUniversityApplicationDetailLogic"
import { UniversityApplicationDetailView } from "./detail-view"
import type { UniversityApplicationDetailPageData } from "@/types/schemas/university-application"

const UniversityApplicationDetailContent = withUniversityApplicationDetailLogic(
    UniversityApplicationDetailView
)

type PageContentProps = {
    applicationId: string
    initialData: UniversityApplicationDetailPageData
}

export function UniversityApplicationDetailPageContent({
    applicationId,
    initialData,
}: PageContentProps) {
    return (
        <UniversityApplicationDetailContent
            applicationId={applicationId}
            initialData={initialData}
        />
    )
}
