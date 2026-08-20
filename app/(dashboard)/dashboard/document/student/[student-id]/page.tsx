"use client"

import { use, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { DetailPageSkeleton } from "@/components/shared/page-skeleton"
import { CourseDocumentsView } from "../../_component/course-documents-view"

type PageProps = {
    params: Promise<{ "student-id": string }>
}

export default function StudentDocumentsPage({ params }: PageProps) {
    const { "student-id": studentId } = use(params)
    const searchParams = useSearchParams()

    const backHref = useMemo(() => {
        const from = searchParams.get("from")
        if (from === "all") return "/dashboard/document/all"
        if (from === "students") return "/dashboard/student"
        if (from === "applications") return "/dashboard/application"
        if (from === "documents") return "/dashboard/document"
        return "/dashboard/document"
    }, [searchParams])

    const backLabel = useMemo(() => {
        const from = searchParams.get("from")
        if (from === "all") return "Back to all documents"
        if (from === "students") return "Back to students"
        if (from === "applications") return "Back to applications"
        if (from === "documents") return "Back to documents"
        return "Back to documents"
    }, [searchParams])

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
        return <DetailPageSkeleton />
    }

    return (
        <CourseDocumentsView
            profileId={studentId}
            studentName={student?.name ?? undefined}
            showBack
            backHref={backHref}
            backLabel={backLabel}
        />
    )
}
