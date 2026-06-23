"use client"

import type { ComponentType } from "react"
import { useQuery } from "@tanstack/react-query"
import type { UniversityApplicationDetail } from "@/types/schemas/university-application"

export type UniversityApplicationDetailLogicProps = {
    detail: UniversityApplicationDetail
}

async function fetchUniversityApplicationDetail(applicationId: string) {
    const res = await fetch(`/api/university/applications/${applicationId}`)
    const json = await res.json()
    if (!res.ok) {
        throw new Error(json?.error ?? "Failed to fetch application detail")
    }
    return json.data as UniversityApplicationDetail
}

export function withUniversityApplicationDetailLogic(
    Component: ComponentType<UniversityApplicationDetailLogicProps>
) {
    return function UniversityApplicationDetailContainer({
        applicationId,
        initialDetail,
    }: {
        applicationId: string
        initialDetail: UniversityApplicationDetail
    }) {
        const detailQuery = useQuery({
            queryKey: ["university-application-detail", applicationId],
            queryFn: () => fetchUniversityApplicationDetail(applicationId),
            initialData: initialDetail,
        })

        return <Component detail={detailQuery.data} />
    }
}
