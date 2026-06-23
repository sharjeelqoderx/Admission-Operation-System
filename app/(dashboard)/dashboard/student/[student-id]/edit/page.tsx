import { notFound } from "next/navigation"
import { fetchStudentForFormPage } from "@/lib/student/server"
import { PageContent } from "./_components/page-content"

type PageProps = {
    params: Promise<{ "student-id": string }>
}

export default async function EditStudentPage({ params }: PageProps) {
    const { "student-id": studentId } = await params
    const initialData = await fetchStudentForFormPage(studentId)

    if (!initialData) {
        notFound()
    }

    return <PageContent studentId={studentId} initialData={initialData} />
}
