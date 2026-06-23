"use client"

import { UniversityStudentDetailView } from "./detail-view"
import { withUniversityStudentDetailLogic } from "./withUniversityStudentDetailLogic"
import type { UniversityStudentDetail } from "@/types/schemas/university-student"

const UniversityStudentDetailContent = withUniversityStudentDetailLogic(
    UniversityStudentDetailView
)

type PageContentProps = {
    profileId: string
    initialDetail: UniversityStudentDetail
}

export function UniversityStudentDetailPageContent({
    profileId,
    initialDetail,
}: PageContentProps) {
    return (
        <UniversityStudentDetailContent
            profileId={profileId}
            initialDetail={initialDetail}
        />
    )
}
