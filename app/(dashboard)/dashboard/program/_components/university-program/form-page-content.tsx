"use client"

import { withUniversityProgramFormLogic } from "./withUniversityProgramFormLogic"
import { UniversityProgramFormView } from "./program-form-view"

const UniversityProgramFormContent = withUniversityProgramFormLogic(UniversityProgramFormView)

type CreatePageContentProps = {
    mode: "create" | "edit"
    courseId?: string
}

export function UniversityProgramFormPageContent({ mode, courseId }: CreatePageContentProps) {
    return <UniversityProgramFormContent mode={mode} courseId={courseId} />
}
