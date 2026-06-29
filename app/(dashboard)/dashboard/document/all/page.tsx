"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { PageLoader } from "@/components/shared/page-loader"
import { AllDocumentsPageContent } from "../_component/all-documents/page-content"
import { withAllDocumentsLogic } from "../_component/all-documents/withAllDocumentsLogic"

const AllDocumentsView = withAllDocumentsLogic(AllDocumentsPageContent)

export default function AllDocumentsPage() {
    const router = useRouter()
    const { me } = useAuth()
    const { data: user, isLoading } = me

    if (isLoading) {
        return <PageLoader label="Loading documents..." />
    }

    if (user?.role !== "AGENT") {
        router.replace("/dashboard/document")
        return <PageLoader label="Redirecting..." />
    }

    return <AllDocumentsView />
}
