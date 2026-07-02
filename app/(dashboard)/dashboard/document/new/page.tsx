import { redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { BluryCard } from "@/components/shared/blury-card"
import { UploadDocumentForm } from "../_component/UploadDocumentForm"

export default async function UploadDocumentPage() {
    const role = await getDashboardRole()

    if (role === "UNIVERSITY") {
        redirect("/dashboard")
    }

    return (
        <>
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                blendColorClass="bg-white/10"
            >
                <UploadDocumentForm />
            </BluryCard>
        </>
    )
}
