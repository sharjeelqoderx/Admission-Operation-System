"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { PageLoader } from "@/components/shared/page-loader"
import { AllDocumentsDashboardPage } from "../_component/all-documents/page-content"
import { isDocumentStaffRole } from "@/lib/auth/university-role"

export default function AllDocumentsPage() {
    const router = useRouter()
    const { me } = useAuth()
    const { data: user, isLoading } = me

    if (isLoading) {
        return <PageLoader />
    }

    if (!isDocumentStaffRole(user?.role)) {
        router.replace("/dashboard/document")
        return <PageLoader />
    }

    return <AllDocumentsDashboardPage />
}
