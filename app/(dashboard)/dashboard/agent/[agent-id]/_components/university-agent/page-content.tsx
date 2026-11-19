"use client"

import { UniversityAgentDetailView } from "./detail-view"
import { withUniversityAgentDetailLogic } from "./withUniversityAgentDetailLogic"

export const UniversityAgentDetailPageContent = withUniversityAgentDetailLogic(
    UniversityAgentDetailView
)
