"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import Loading from "./loading"
import { AllDocumentsDashboardPage } from "../_component/all-documents/page-content"
import { isDocumentStaffRole } from "@/lib/auth/university-role"

export default function AllDocumentsPage() {
    const router = useRouter()
    const { me } = useAuth()
    const { data: user, isLoading } = me

    if (isLoading) {
        return <Loading />
    }

    if (!isDocumentStaffRole(user?.role)) {
        router.replace("/dashboard/document")
        return <Loading />
    }

    return <AllDocumentsDashboardPage />
}
