"use client"

import { memo, useCallback, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { Typography } from "@/components/shared/Typography"
import { PanelSkeleton } from "@/components/shared/page-skeleton"
import { ErrorView } from "@/components/shared/error-view"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { DocumentTemplateProgramOptionsResponse } from "@/types/schemas/document-template"
import { DOCUMENT_TEMPLATE_PROGRAM_OPTIONS_QUERY_KEY } from "@/lib/document-template/query-cache"

type DocumentTemplateProgramSelectProps = {
    value: string[]
    excludeTemplateId?: string | null
    disabled?: boolean
    onChange: (programIds: string[]) => void
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

    const selectedSet = useMemo(() => new Set(value), [value])

    const selectedOptions = useMemo(
        () => options.filter((option) => selectedSet.has(option.id)),
        [options, selectedSet]
    )

    const toggleProgram = useCallback(
        (programId: string) => {
            if (selectedSet.has(programId)) {
                onChange(value.filter((id) => id !== programId))
                return
            }
            onChange([...value, programId])
        },
        [onChange, selectedSet, value]
    )

    const removeProgram = useCallback(
        (programId: string) => {
            onChange(value.filter((id) => id !== programId))
        },
        [onChange, value]
    )

    const summaryLabel = useMemo(() => {
        if (selectedOptions.length === 0) {
            return options.length === 0
                ? "No available programs"
                : "Select one or more programs"
        }
        if (selectedOptions.length === 1) {
            return selectedOptions[0].label
        }
        return `${selectedOptions.length} programs selected`
    }, [options.length, selectedOptions])

    return (
        <div className="space-y-3 rounded-xl border border-brand-secondary/20 bg-white/50 p-4 shadow-sm">
            <div className="space-y-1">
                <Typography as="label" font="sub-text" className="font-semibold text-gray-800">
                    Offer programs
                </Typography>
                <Typography as="p" font="small" className="text-muted-foreground">
                    One template can power multiple programs. Each program can still only belong
                    to one offer template.
                </Typography>
            </div>

            {programOptionsQuery.isLoading ? (
                <PanelSkeleton className="py-2" rows={2} />
            ) : programOptionsQuery.isError ? (
                <ErrorView
                    message={
                        programOptionsQuery.error instanceof Error
                            ? programOptionsQuery.error.message
                            : "Failed to load programs"
                    }
                />
            ) : (
                <div className="space-y-3">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={disabled || options.length === 0}
                                className={cn(
                                    "h-auto min-h-11 w-full justify-between rounded-lg border-brand-secondary/25 bg-white/80 px-3 py-2 text-left font-normal hover:bg-white",
                                    selectedOptions.length === 0 && "text-muted-foreground"
                                )}
                            >
                                <Typography as="span" className="line-clamp-2 text-sm">
                                    {summaryLabel}
                                </Typography>
                                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            align="start"
                            className="w-[var(--radix-popover-trigger-width)] max-h-72 overflow-y-auto p-2"
                        >
                            {options.length === 0 ? (
                                <Typography as="p" font="small" className="px-2 py-3 text-muted-foreground">
                                    No available programs
                                </Typography>
                            ) : (
                                <div className="space-y-1">
                                    {options.map((option) => {
                                        const checked = selectedSet.has(option.id)
                                        return (
                                            <button
                                                key={option.id}
                                                type="button"
                                                className={cn(
                                                    "flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-brand-secondary/10",
                                                    checked && "bg-brand-secondary/5"
                                                )}
                                                onClick={() => toggleProgram(option.id)}
                                            >
                                                <Checkbox
                                                    checked={checked}
                                                    className="mt-0.5"
                                                    tabIndex={-1}
                                                    aria-hidden
                                                />
                                                <div className="min-w-0 flex-1 space-y-0.5">
                                                    <Typography
                                                        as="span"
                                                        className="block text-sm font-medium text-gray-800"
                                                    >
                                                        {option.label}
                                                    </Typography>
                                                    {option.is_assigned ? (
                                                        <Typography
                                                            as="span"
                                                            className="block text-[11px] text-muted-foreground"
                                                        >
                                                            Currently assigned to this template
                                                        </Typography>
                                                    ) : null}
                                                </div>
                                                {checked ? (
                                                    <Check className="mt-0.5 size-4 shrink-0 text-brand-secondary" />
                                                ) : null}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </PopoverContent>
                    </Popover>

                    {selectedOptions.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {selectedOptions.map((option) => (
                                <Badge
                                    key={option.id}
                                    variant="outline"
                                    className="h-auto max-w-full gap-1.5 rounded-full border-brand-secondary/25 bg-brand-secondary/5 px-2.5 py-1 text-left"
                                >
                                    <Typography
                                        as="span"
                                        className="truncate text-xs font-medium text-gray-700"
                                    >
                                        {option.label}
                                    </Typography>
                                    <button
                                        type="button"
                                        disabled={disabled}
                                        className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-brand-secondary/15 hover:text-gray-800"
                                        aria-label={`Remove ${option.label}`}
                                        onClick={() => removeProgram(option.id)}
                                    >
                                        <X className="size-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    )
})
