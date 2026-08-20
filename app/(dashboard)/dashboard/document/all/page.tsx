"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { ListPageSkeleton } from "@/components/shared/page-skeleton"
import { AllDocumentsDashboardPage } from "../_component/all-documents/page-content"
import { isDocumentStaffRole } from "@/lib/auth/university-role"

export default function AllDocumentsPage() {
    const router = useRouter()
    const { me } = useAuth()
    const { data: user, isLoading } = me

    if (isLoading) {
        return (
            <div className="min-h-[60vh]">
                <ListPageSkeleton />
            </div>
        )
    }

    if (!isDocumentStaffRole(user?.role)) {
        router.replace("/dashboard/document")
        return (
            <div className="min-h-[60vh]">
                <ListPageSkeleton />
            </div>
        )
    }

    return <AllDocumentsDashboardPage />
}
