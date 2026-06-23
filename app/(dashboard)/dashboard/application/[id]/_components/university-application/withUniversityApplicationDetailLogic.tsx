"use client"

import type { ComponentType } from "react"
import { useQuery } from "@tanstack/react-query"
import type {
    UniversityApplicationDetail,
    UniversityApplicationDetailPageData,
} from "@/types/schemas/university-application"

export type UniversityApplicationDetailLogicProps = {
    detail?: UniversityApplicationDetail
    isLoading: boolean
    isError: boolean
    errorMessage: string
    onRetry: () => void
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
        initialData,
    }: {
        applicationId: string
        initialData: UniversityApplicationDetailPageData
    }) {
        const detailQuery = useQuery({
            queryKey: ["university-application-detail", applicationId],
            queryFn: () => fetchUniversityApplicationDetail(applicationId),
            initialData: initialData.detail ?? undefined,
            retry: false,
        })

        const detail = detailQuery.data ?? initialData.detail ?? undefined
        const isLoading = detailQuery.isLoading && !detail
        const isError =
            !detail && !isLoading && (Boolean(initialData.error) || detailQuery.isError)
        const errorMessage =
            initialData.error ??
            (detailQuery.error instanceof Error
                ? detailQuery.error.message
                : "Application not found")

        return (
            <Component
                detail={detail}
                isLoading={isLoading}
                isError={isError}
                errorMessage={errorMessage}
                onRetry={() => {
                    void detailQuery.refetch()
                }}
            />
        )
    }
}
