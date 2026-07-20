import { redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { BluryCard } from "@/components/shared/blury-card"
import { UploadDocumentForm } from "../_component/UploadDocumentForm"
import { Role } from "@/types/enums/role"

export default async function UploadDocumentPage() {
    const role = await getDashboardRole()

    if (role === Role.ADMIN || role === Role.SUPER_ADMIN) {
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
