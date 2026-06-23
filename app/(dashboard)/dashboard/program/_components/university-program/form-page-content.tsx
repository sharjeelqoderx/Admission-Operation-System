"use client"

import { withUniversityProgramFormLogic } from "./withUniversityProgramFormLogic"
import { UniversityProgramFormView } from "./program-form-view"
import type { UniversityProgramDetail } from "@/types/schemas/university-program"

const UniversityProgramFormContent = withUniversityProgramFormLogic(UniversityProgramFormView)

type CreatePageContentProps = {
    mode: "create" | "edit"
    courseId?: string
    initialDetail?: UniversityProgramDetail
}

export function UniversityProgramFormPageContent({
    mode,
    courseId,
    initialDetail,
}: CreatePageContentProps) {
    return (
        <UniversityProgramFormContent
            mode={mode}
            courseId={courseId}
            initialDetail={initialDetail}
        />
    )
}
