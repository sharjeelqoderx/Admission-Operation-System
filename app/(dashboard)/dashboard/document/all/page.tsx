"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { PageLoader } from "@/components/shared/page-loader"
import { DocumentStudentsList } from "../_component/document-students-list"
import { Role } from "@/types/enums/role"

export default function AllDocumentsPage() {
    const router = useRouter()
    const { me } = useAuth()
    const { data: user, isLoading } = me

    if (isLoading) {
        return <PageLoader />
    }

    if (
        user?.role !== Role.AGENT &&
        user?.role !== Role.ADMIN &&
        user?.role !== Role.SUPER_ADMIN
    ) {
        router.replace("/dashboard/document")
        return <PageLoader />
    }

    return (
        <DocumentStudentsList
            title="View All Documents"
            description="Select a student to view all their uploaded documents."
            getViewHref={(studentId) =>
                `/dashboard/document/student/${studentId}?from=all`
            }
        />
    )
}
