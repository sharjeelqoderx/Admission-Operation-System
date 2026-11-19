"use client"

import type { ComponentType } from "react"
import { useQuery } from "@tanstack/react-query"
import { ErrorView } from "@/components/shared/error-view"
import type { UniversityStudentDetail } from "@/types/schemas/university-student"
import Loading from "../../loading"

export type UniversityStudentDetailLogicProps = {
    detail: UniversityStudentDetail
}

async function fetchUniversityStudentDetail(profileId: string) {
    const res = await fetch(`/api/university/students/${profileId}`)
    const json = await res.json()
    if (!res.ok) {
        throw new Error(json?.error ?? "Failed to fetch student detail")
    }
    return json.data as UniversityStudentDetail
}

export function withUniversityStudentDetailLogic(
    Component: ComponentType<UniversityStudentDetailLogicProps>
) {
    return function UniversityStudentDetailContainer({ profileId }: { profileId: string }) {
        const { data, isLoading, error } = useQuery({
            queryKey: ["university-student-detail", profileId],
            queryFn: () => fetchUniversityStudentDetail(profileId),
            staleTime: 5 * 60 * 1000,
        })

        if (isLoading) return <Loading />
        if (!data) {
            return <ErrorView message={error instanceof Error ? error.message : "Student not found"} />
        }

        return <Component detail={data} />
    }
}
