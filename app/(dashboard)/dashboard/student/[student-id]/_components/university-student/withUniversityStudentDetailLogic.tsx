"use client"

import type { ComponentType } from "react"
import { useQuery } from "@tanstack/react-query"
import type { UniversityStudentDetail } from "@/types/schemas/university-student"

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
    return function UniversityStudentDetailContainer({
        profileId,
        initialDetail,
    }: {
        profileId: string
        initialDetail: UniversityStudentDetail
    }) {
        const detailQuery = useQuery({
            queryKey: ["university-student-detail", profileId],
            queryFn: () => fetchUniversityStudentDetail(profileId),
            initialData: initialDetail,
        })

        return <Component detail={detailQuery.data} />
    }
}
