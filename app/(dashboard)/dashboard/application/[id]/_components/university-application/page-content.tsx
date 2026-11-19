"use client"

import { withUniversityApplicationDetailLogic } from "./withUniversityApplicationDetailLogic"
import { UniversityApplicationDetailView } from "./detail-view"

export const UniversityApplicationDetailPageContent = withUniversityApplicationDetailLogic(
    UniversityApplicationDetailView
)
