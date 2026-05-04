"use client"

import { use } from "react"
import { Suspense } from "react"
import { ViewStudentProfile } from "@/components/ViewStudentProfile"

type PageProps = {
    params: Promise<{ "student-id": string }>
}

export default function StudentDetailPage({ params }: PageProps) {
    const { "student-id": id } = use(params)
    return (
        <div className="space-y-10">
            <Suspense fallback={<div className="py-10 text-center text-sm text-muted-foreground">Loading...</div>}>
                <ViewStudentProfile id={id} />
            </Suspense>
        </div>
    )
}
