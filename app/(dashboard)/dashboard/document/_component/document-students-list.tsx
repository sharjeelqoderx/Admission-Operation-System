"use client"

import { useQuery } from "@tanstack/react-query"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { DocumentTable, type DocumentStudentRow } from "./DocumentTable"

type Props = {
    title?: string
    description?: string
    getViewHref?: (studentId: string) => string
}

export function DocumentStudentsList({
    title = "All Documents",
    description = "Select a student to view programs and upload required documents to their profile.",
    getViewHref,
}: Props = {}) {
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["documents", "students"],
        queryFn: async () => {
            const res = await fetch("/api/document")
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error ?? "Failed to fetch students")
            return json as { data: DocumentStudentRow[]; role: string }
        },
    })

    const rows = Array.isArray(data?.data) ? data.data : []

    return (
        <div className="space-y-6">
            <BluryCard isCentered={false} childClass="space-y-2" className="rounded-2xl">
                <Typography as="h2" font="sub-heading" className="font-bold tracking-tight">
                    {title}
                </Typography>
                <Typography as="p" font="sub-text" className="text-gray-600">
                    {description}
                </Typography>
            </BluryCard>

            <DocumentTable
                rows={rows}
                isLoading={isLoading}
                isError={isError}
                onRetry={() => refetch()}
                getViewHref={getViewHref}
            />
        </div>
    )
}
