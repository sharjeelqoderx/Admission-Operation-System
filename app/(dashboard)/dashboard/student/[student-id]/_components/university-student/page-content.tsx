"use client"

import { UniversityStudentDetailView } from "./detail-view"
import { withUniversityStudentDetailLogic } from "./withUniversityStudentDetailLogic"

export const UniversityStudentDetailPageContent = withUniversityStudentDetailLogic(
    UniversityStudentDetailView
)
