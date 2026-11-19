import { PageContent } from "./_components/page-content"

type PageProps = {
    params: Promise<{ "student-id": string }>
}

export default async function EditStudentPage({ params }: PageProps) {
    const { "student-id": studentId } = await params

    return <PageContent studentId={studentId} />
}
