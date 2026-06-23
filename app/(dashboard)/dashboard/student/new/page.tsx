import { fetchStudentFormCreatePageData } from "@/lib/student/server"
import { PageContent } from "./_components/page-content"

export default async function NewStudentPage() {
    const initialData = await fetchStudentFormCreatePageData()

    return <PageContent initialData={initialData} />
}