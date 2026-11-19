"use client"

import { withUniversityProgramDetailLogic } from "./withUniversityProgramDetailLogic"
import { UniversityProgramDetailView } from "./detail-view"

const UniversityProgramDetailContent = withUniversityProgramDetailLogic(UniversityProgramDetailView)

type PageContentProps = {
    courseId: string
    canEditProgram: boolean
}

export function UniversityProgramDetailPageContent({ courseId, canEditProgram }: PageContentProps) {
    return <UniversityProgramDetailContent courseId={courseId} canEditProgram={canEditProgram} />
}
