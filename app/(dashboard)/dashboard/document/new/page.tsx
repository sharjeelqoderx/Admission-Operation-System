import { BluryCard } from "@/components/shared/blury-card"
import { UploadDocumentForm } from "../_component/UploadDocumentForm"

export default function UploadDocumentPage() {
    return (
        <>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Upload Document</h1>
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
