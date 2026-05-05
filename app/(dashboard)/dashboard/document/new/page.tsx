import { BluryCard } from "@/components/shared/blury-card"
import { UploadDocumentForm } from "../_component/UploadDocumentForm"

export default function UploadDocumentPage() {
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
