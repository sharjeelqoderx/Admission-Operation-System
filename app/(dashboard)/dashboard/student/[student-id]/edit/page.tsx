"use client"

import { useQuery } from "@tanstack/react-query"
import { use } from "react"
import { Typography } from "@/components/shared/Typography"
import { StudentForm } from "@/components/StudentForm"
import { PageLoader } from "@/components/shared/page-loader"
import { BluryCard } from "@/components/shared/blury-card"

type PageProps = {
    params: Promise<{ "student-id": string }>
}

export default function Page({ params }: PageProps) {
    const { "student-id": studentId } = use(params)

    const { data, isLoading, isError } = useQuery({
        queryKey: ["students", studentId],
        queryFn: async () => {
            const res = await fetch(`/api/student/${studentId}`)
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error ?? "Failed to fetch student")
            return json.data
        },
        enabled: !!studentId,
    })

    return (
        <main className="min-h-screen">

            <BluryCard
                isCentered={false}
                sharpCorners={[]}
                blurAmount="backdrop-blur-2xl"
                className="w-full space-y-4"
            >
                <div className="flex flex-col gap-2 pb-4 border-b-2 border-gray-300">
                    <Typography as="h2" font="text-xl" className="text-gray-900">
                        Edit Student Profile
                    </Typography>
                    <Typography as="p" font="text" className="text-gray-600 max-w-3xl leading-relaxed">
                        Initiate a new student profile and link them to global academic programs. Ensure all mandatory fields are verified before submission.
                    </Typography>
                </div>

                {isLoading && <PageLoader label="Loading student..." />}
                {isError && <div className="p-8 text-sm font-medium text-gray-500">Student not found.</div>}
                {data && <StudentForm mode="edit" studentId={studentId} defaultData={data} />}
            </BluryCard>
        </main>
    )
}
