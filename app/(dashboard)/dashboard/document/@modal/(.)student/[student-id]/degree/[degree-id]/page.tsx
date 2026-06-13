import { use } from "react"
import { RouteModal } from "@/components/shared/route-modal"
import { DegreeDocumentsPanel } from "@/app/(dashboard)/dashboard/document/_component/degree-documents-panel"

type PageProps = {
    params: Promise<{ "student-id": string; "degree-id": string }>
}

export default function DegreeDocumentsModalPage({ params }: PageProps) {
    const { "student-id": studentId, "degree-id": degreeId } = use(params)

    return (
        <RouteModal
            title="Program documents"
            description="Upload and manage required documents for this program."
            className="sm:max-w-6xl max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0"
        >
            <DegreeDocumentsPanel
                studentId={studentId}
                degreeId={degreeId}
                variant="modal"
            />
        </RouteModal>
    )
}
