"use client"

import { UniversityAgentDetailView } from "./detail-view"
import { withUniversityAgentDetailLogic } from "./withUniversityAgentDetailLogic"
import type { UniversityAgentDetail } from "@/types/schemas/university-agent"

const UniversityAgentDetailContent = withUniversityAgentDetailLogic(UniversityAgentDetailView)

type PageContentProps = {
    profileId: string
    initialDetail: UniversityAgentDetail
}

export function UniversityAgentDetailPageContent({
    profileId,
    initialDetail,
}: PageContentProps) {
    return (
        <UniversityAgentDetailContent profileId={profileId} initialDetail={initialDetail} />
    )
}
