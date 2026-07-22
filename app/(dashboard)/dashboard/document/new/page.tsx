import { redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { BluryCard } from "@/components/shared/blury-card"
import { UploadDocumentForm } from "../_component/UploadDocumentForm"
import { isUniversityStaffRole } from "@/lib/auth/university-role"
import { Role } from "@/types/enums/role"

export default async function UploadDocumentPage() {
    const role = await getDashboardRole()

    if (isUniversityStaffRole(role)) {
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
