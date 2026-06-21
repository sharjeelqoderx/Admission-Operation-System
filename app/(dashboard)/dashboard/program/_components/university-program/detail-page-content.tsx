"use client"

import { withUniversityProgramDetailLogic } from "./withUniversityProgramDetailLogic"
import { UniversityProgramDetailView } from "./detail-view"
import type { UniversityProgramDetail } from "@/types/schemas/university-program"

const UniversityProgramDetailContent = withUniversityProgramDetailLogic(UniversityProgramDetailView)

type PageContentProps = {
    courseId: string
    initialDetail: UniversityProgramDetail
}

export function UniversityProgramDetailPageContent({
    courseId,
    initialDetail,
}: PageContentProps) {
    return (
        <UniversityProgramDetailContent courseId={courseId} initialDetail={initialDetail} />
    )
}
