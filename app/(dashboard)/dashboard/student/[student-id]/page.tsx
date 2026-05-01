"use client"

import { use } from "react"
import { Suspense } from "react"
import { ViewStudentProfile } from "@/components/ViewStudentProfile"
import { useSearchParams } from "next/navigation"

type PageProps = {
    params: Promise<{ "student-id": string }>
}

function ProfileWithId({ id }: { id: string }) {
    return <ViewStudentProfile id={id} />
}

export default function StudentDetailPage({ params }: PageProps) {
    const { "student-id": id } = use(params)
    return (
        <div className="space-y-10 pb-10 p-6 lg:p-10">
            <Suspense fallback={<div className="py-10 text-center text-sm text-muted-foreground">Loading...</div>}>
                <ProfileWithId id={id} />
            </Suspense>
        </div>
    )
}
