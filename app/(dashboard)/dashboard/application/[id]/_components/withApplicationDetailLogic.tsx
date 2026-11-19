"use client"

import type { ComponentType } from "react"
import { useQuery } from "@tanstack/react-query"
import type { ApplicationDetail } from "@/types/schemas/application"

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
    return function ApplicationDetailContainer({ applicationId }: { applicationId: string }) {
        const detailQuery = useQuery({
            queryKey: ["application", applicationId],
            queryFn: () => fetchApplicationDetailFromApi(applicationId),
            retry: false,
        })

        return (
            <Component
                application={detailQuery.data}
                isLoading={detailQuery.isLoading}
                isError={detailQuery.isError}
                errorMessage={
                    detailQuery.error instanceof Error
                        ? detailQuery.error.message
                        : "Application not found"
                }
                onRetry={() => {
                    void detailQuery.refetch()
                }}
            />
        )
    }
}
