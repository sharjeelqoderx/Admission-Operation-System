"use client"

import { withUniversityProgramDetailLogic } from "./withUniversityProgramDetailLogic"
import { UniversityProgramDetailView } from "./detail-view"
import type { UniversityProgramDetail } from "@/types/schemas/university-program"

const UniversityProgramDetailContent = withUniversityProgramDetailLogic(UniversityProgramDetailView)

type PageContentProps = {
    courseId: string
    initialDetail: UniversityProgramDetail
    canEditProgram: boolean
}

export function UniversityProgramDetailPageContent({
    courseId,
    initialDetail,
    canEditProgram,
}: PageContentProps) {
    return (
        <UniversityProgramDetailContent
            courseId={courseId}
            initialDetail={initialDetail}
            canEditProgram={canEditProgram}
        />
    )
}
