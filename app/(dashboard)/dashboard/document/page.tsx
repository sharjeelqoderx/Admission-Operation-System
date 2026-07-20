"use client"

import { PageLoader } from "@/components/shared/page-loader"
import { useAuth } from "@/hooks/useAuth"
import { CourseDocumentsView } from "./_component/course-documents-view"
import { DocumentStudentsList } from "./_component/document-students-list"
import { Role } from "@/types/enums/role"

export default function DocumentPage() {
    const { me } = useAuth()
    const { data: user, isLoading } = me

    if (isLoading) {
        return <PageLoader />
    }

    if (user?.role === Role.AGENT) {
        return <DocumentStudentsList />
    }

    return <CourseDocumentsView />
}
