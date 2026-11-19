"use client"

import { useQuery } from "@tanstack/react-query"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { ErrorView } from "@/components/shared/error-view"
import { StudentForm, type StudentFormPageData } from "../../../_components/student-form"
import Loading from "../../loading"

export function PageContent({ studentId }: { studentId: string }) {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["students", studentId, "form"],
        queryFn: async () => {
            const res = await fetch(`/api/student/${studentId}`)
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error ?? "Student not found")
            return json.data as StudentFormPageData
        },
        staleTime: Infinity,
        gcTime: 0,
    })

    if (isLoading) return <Loading />
    if (isError || !data) {
        return <ErrorView message={error instanceof Error ? error.message : "Student not found"} />
    }

    return (
        <BluryCard
            isCentered={false}
            blurAmount="backdrop-blur-xl"
            blendColorClass="bg-white/20"
            className=""
            childClass="p-0!"
        >
            <div className="space-y-1 max-w-2xl p-6 border-b-2 border-gray-300">
                <Typography as="h2" font="sub-heading" className="font-bold tracking-tight">
                    Edit Student Profile
                </Typography>
                <Typography
                    as="p"
                    font="sub-text"
                    className="text-gray-500 font-medium max-w-2xl leading-relaxed"
                >
                    Update the student profile and verify all mandatory fields before saving changes.
                </Typography>
            </div>

            <StudentForm mode="edit" studentId={studentId} defaultData={data} />
        </BluryCard>
    )
}
