"use client"

import { use } from "react"
import { useQuery } from "@tanstack/react-query"
import { PageLoader } from "@/components/shared/page-loader"
import { CourseDocumentsView } from "../../_component/course-documents-view"

type PageProps = {
    params: Promise<{ "student-id": string }>
}

export default function StudentDocumentsPage({ params }: PageProps) {
    const { "student-id": studentId } = use(params)

    const { data: student, isLoading } = useQuery({
        queryKey: ["students", studentId],
        queryFn: async () => {
            const res = await fetch(`/api/student/${studentId}`)
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error ?? "Failed to fetch student")
            return json.data as { name?: string | null }
        },
        enabled: Boolean(studentId),
    })

    if (isLoading) {
        return <PageLoader label="Loading student documents..." />
    }

    return (
        <CourseDocumentsView
            profileId={studentId}
            studentName={student?.name ?? undefined}
            showBack
        />
    )
}
