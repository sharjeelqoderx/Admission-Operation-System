"use client"

import type { ComponentType } from "react"
import { useQuery } from "@tanstack/react-query"
import { ErrorView } from "@/components/shared/error-view"
import Loading from "../../[program-id]/loading"
import type { UniversityProgramDetail } from "@/types/schemas/university-program"

export type UniversityProgramDetailLogicProps = {
    detail: UniversityProgramDetail
    canEditProgram: boolean
}

async function fetchUniversityProgramDetail(courseId: string) {
    const res = await fetch(`/api/university/programs/${courseId}`)
    const json = await res.json()
    if (!res.ok) {
        throw new Error(json?.error ?? "Failed to fetch program detail")
    }
    return json.data as UniversityProgramDetail
}

export function withUniversityProgramDetailLogic(
    Component: ComponentType<UniversityProgramDetailLogicProps>
) {
    return function UniversityProgramDetailContainer({
        courseId,
        canEditProgram,
    }: {
        courseId: string
        canEditProgram: boolean
    }) {
        const detailQuery = useQuery({
            queryKey: ["university-program-detail", courseId],
            queryFn: () => fetchUniversityProgramDetail(courseId),
            staleTime: Infinity, // Cache indefinitely to avoid refetch on navigation
        })

        if (detailQuery.isError) {
            return <ErrorView message={detailQuery.error.message} />
        }

        if (!detailQuery.data) {
            return <Loading />
        }

        return <Component detail={detailQuery.data} canEditProgram={canEditProgram} />
    }
}
