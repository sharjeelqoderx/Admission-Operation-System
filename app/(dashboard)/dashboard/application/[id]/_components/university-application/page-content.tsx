"use client"

import { withUniversityApplicationDetailLogic } from "./withUniversityApplicationDetailLogic"
import { UniversityApplicationDetailView } from "./detail-view"
import type { UniversityApplicationDetail } from "@/types/schemas/university-application"

const UniversityApplicationDetailContent = withUniversityApplicationDetailLogic(
    UniversityApplicationDetailView
)

type PageContentProps = {
    applicationId: string
    initialDetail: UniversityApplicationDetail
}

export function UniversityApplicationDetailPageContent({
    applicationId,
    initialDetail,
}: PageContentProps) {
    return (
        <UniversityApplicationDetailContent
            applicationId={applicationId}
            initialDetail={initialDetail}
        />
    )
}
