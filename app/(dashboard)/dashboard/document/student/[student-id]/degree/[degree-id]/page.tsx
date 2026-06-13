import { use } from "react"
import { DegreeDocumentsPanel } from "@/app/(dashboard)/dashboard/document/_component/degree-documents-panel"

type PageProps = {
    params: Promise<{ "student-id": string; "degree-id": string }>
}

export default function DegreeDocumentsPage({ params }: PageProps) {
    const { "student-id": studentId, "degree-id": degreeId } = use(params)

    return (
        <main className="max-w-[1400px] mx-auto space-y-6 px-2 sm:px-0 pt-2 pb-12">
            <DegreeDocumentsPanel
                studentId={studentId}
                degreeId={degreeId}
                variant="page"
            />
        </main>
    )
}
