"use client"

import { useQuery } from "@tanstack/react-query"
import { use } from "react"
import { Typography } from "@/components/shared/Typography"
import { StudentForm } from "@/components/StudentForm"
import { PageLoader } from "@/components/shared/page-loader"

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
            <div className="relative z-10 max-w-7xl mx-auto space-y-10 border-x border-white/40 rounded-l-lg rounded-r-lg">
                <div className="flex flex-col gap-2 p-8 m-0 pb-4 border-b-2 border-gray-300">
                    <Typography as="h2" className="text-[24px] font-extrabold text-gray-900 tracking-tight">
                        Edit Student Profile
                    </Typography>
                    <Typography as="p" className="text-[15px] text-gray-600 font-medium max-w-3xl leading-relaxed opacity-80">
                        Initiate a new student profile and link them to global academic programs. Ensure all mandatory fields are verified before submission.
                    </Typography>
                </div>

                {isLoading && <PageLoader label="Loading student..." />}
                {isError && <div className="p-8 text-sm font-medium text-gray-500">Student not found.</div>}
                {data && <StudentForm mode="edit" studentId={studentId} defaultData={data} />}
            </div>
        </main>
    )
}
