import { redirect } from "next/navigation"

type PageProps = {
    params: Promise<{ "student-id": string }>
}

export default async function StudentEditByIdPage({ params }: PageProps) {
    const resolved = await params
    const studentId = resolved["student-id"]
    redirect(`/dashboard/student/edit?id=${studentId}`)
}

