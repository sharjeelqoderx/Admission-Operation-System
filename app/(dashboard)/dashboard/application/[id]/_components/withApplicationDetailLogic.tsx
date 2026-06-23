"use client"

import type { ComponentType } from "react"
import { useQuery } from "@tanstack/react-query"
import type { ApplicationDetail, ApplicationDetailPageData } from "@/types/schemas/application"

export type ApplicationDetailLogicProps = {
    application?: ApplicationDetail
    isLoading: boolean
    isError: boolean
    errorMessage: string
    onRetry: () => void
}

async function fetchApplicationDetailFromApi(applicationId: string) {
    const res = await fetch(`/api/application/${applicationId}`)
    const json = await res.json()
    if (!res.ok) {
        throw new Error(json.error ?? "Failed to fetch application")
    }
    return json.data as ApplicationDetail
}

export function withApplicationDetailLogic(Component: ComponentType<ApplicationDetailLogicProps>) {
    return function ApplicationDetailContainer({
        applicationId,
        initialData,
    }: {
        applicationId: string
        initialData: ApplicationDetailPageData
    }) {
        const detailQuery = useQuery({
            queryKey: ["application", applicationId],
            queryFn: () => fetchApplicationDetailFromApi(applicationId),
            initialData: initialData.detail ?? undefined,
            retry: false,
        })

        const application = detailQuery.data ?? initialData.detail ?? undefined
        const isLoading = detailQuery.isLoading && !application
        const isError =
            !application &&
            !isLoading &&
            (Boolean(initialData.error) || detailQuery.isError)
        const errorMessage =
            initialData.error ??
            (detailQuery.error instanceof Error
                ? detailQuery.error.message
                : "Application not found")

        return (
            <Component
                application={application}
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
