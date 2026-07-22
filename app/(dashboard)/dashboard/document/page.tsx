"use client"

import { PageLoader } from "@/components/shared/page-loader"
import { useAuth } from "@/hooks/useAuth"
import { CourseDocumentsView } from "./_component/course-documents-view"
import { DocumentStudentsList } from "./_component/document-students-list"
import { isDocumentStaffRole } from "@/lib/auth/university-role"

export default function DocumentPage() {
    const { me } = useAuth()
    const { data: user, isLoading } = me

    if (isLoading) {
        return <PageLoader />
    }

    if (isDocumentStaffRole(user?.role)) {
        return <DocumentStudentsList />
    }

    return <CourseDocumentsView />
}
