"use client"

import { memo, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Typography } from "@/components/shared/Typography"
import { PageLoader } from "@/components/shared/page-loader"
import { ErrorView } from "@/components/shared/error-view"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { DocumentTemplateProgramOptionsResponse } from "@/types/schemas/document-template"
import { DOCUMENT_TEMPLATE_PROGRAM_OPTIONS_QUERY_KEY } from "@/lib/document-template/query-cache"

type DocumentTemplateProgramSelectProps = {
    value: string | null
    excludeTemplateId?: string | null
    disabled?: boolean
    onChange: (programId: string | null) => void
}

async function fetchProgramOptions(
    excludeTemplateId?: string | null
): Promise<DocumentTemplateProgramOptionsResponse["data"]> {
    const params = new URLSearchParams()
    if (excludeTemplateId) {
        params.set("exclude_template_id", excludeTemplateId)
    }

    const query = params.toString()
    const res = await fetch(
        `/api/document-template/program-options${query ? `?${query}` : ""}`
    )
    const json = await res.json()

    if (!res.ok) {
        throw new Error(json?.error ?? "Failed to fetch program options")
    }

    return json.data
}

export const DocumentTemplateProgramSelect = memo(function DocumentTemplateProgramSelect({
    value,
    excludeTemplateId,
    disabled = false,
    onChange,
}: DocumentTemplateProgramSelectProps) {
    const programOptionsQuery = useQuery({
        queryKey: [...DOCUMENT_TEMPLATE_PROGRAM_OPTIONS_QUERY_KEY, excludeTemplateId ?? "new"],
        queryFn: () => fetchProgramOptions(excludeTemplateId),
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    })

    const options = useMemo(
        () => programOptionsQuery.data ?? [],
        [programOptionsQuery.data]
    )

    const selectedLabel = useMemo(() => {
        if (!value) return null
        return options.find((option) => option.id === value)?.label ?? null
    }, [options, value])

    return (
        <div className="space-y-2">
            <Label htmlFor="document-template-program">
                <Typography as="span" className="text-sm font-semibold text-gray-800">
                    Offer program
                </Typography>
            </Label>
            <Typography as="p" className="text-xs text-muted-foreground">
                Each program can only have one offer template. Programs that already have a
                template assigned are hidden from this list.
            </Typography>

            {programOptionsQuery.isLoading ? (
                <PageLoader className="py-6" />
            ) : programOptionsQuery.isError ? (
                <ErrorView
                    message={
                        programOptionsQuery.error instanceof Error
                            ? programOptionsQuery.error.message
                            : "Failed to load programs"
                    }
                />
            ) : (
                <Select
                    value={value ?? undefined}
                    disabled={disabled || options.length === 0}
                    onValueChange={(nextValue) => onChange(nextValue)}
                >
                    <SelectTrigger id="document-template-program" className="w-full">
                        <SelectValue
                            placeholder={
                                options.length === 0
                                    ? "No available programs"
                                    : "Select a program for this offer template"
                            }
                        >
                            {selectedLabel}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {options.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
        </div>
    )
})
