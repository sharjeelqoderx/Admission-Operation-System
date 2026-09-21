"use client"

import { memo } from "react"
import { GraduationCap } from "lucide-react"
import { Typography } from "@/components/shared/Typography"
import { Badge } from "@/components/ui/badge"
import type { DocumentTemplateCourseSummary } from "@/types/schemas/document-template"

type DocumentTemplateAttachedProgramsProps = {
    programs: DocumentTemplateCourseSummary[]
    compact?: boolean
    emptyLabel?: string
}

export const DocumentTemplateAttachedPrograms = memo(function DocumentTemplateAttachedPrograms({
    programs,
    compact = false,
    emptyLabel = "No programs linked to this template yet.",
}: DocumentTemplateAttachedProgramsProps) {
    if (programs.length === 0) {
        return (
            <div className="flex items-start gap-2 rounded-lg border border-dashed border-brand-secondary/25 bg-white/40 px-3 py-2.5">
                <GraduationCap className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <Typography as="p" font="small" className="text-muted-foreground">
                    {emptyLabel}
                </Typography>
            </div>
        )
    }

    if (compact) {
        const primary = programs[0]?.label ?? "Linked program"
        const extraCount = Math.max(programs.length - 1, 0)
        const titleText = programs.map((program) => program.label).join(", ")

        return (
            <div className="min-w-0" title={titleText}>
                <Typography as="span" className="block truncate text-sm font-medium text-gray-800">
                    {primary}
                </Typography>
                {extraCount > 0 ? (
                    <Typography as="span" className="block text-xs text-muted-foreground">
                        +{extraCount} more program{extraCount === 1 ? "" : "s"}
                    </Typography>
                ) : null}
            </div>
        )
    }

    return (
        <div className="space-y-2 rounded-xl border border-brand-secondary/20 bg-white/50 p-4 shadow-sm">
            <div className="flex items-center gap-2">
                <GraduationCap className="size-4 text-brand-secondary" />
                <Typography as="p" font="sub-text" className="font-semibold text-gray-800">
                    Linked programs ({programs.length})
                </Typography>
            </div>
            <div className="flex flex-wrap gap-2">
                {programs.map((program) => (
                    <Badge
                        key={program.id}
                        variant="outline"
                        className="h-auto max-w-full rounded-full border-brand-secondary/25 bg-brand-secondary/5 px-2.5 py-1 text-left"
                    >
                        <Typography
                            as="span"
                            className="truncate text-xs font-medium text-gray-700"
                        >
                            {program.label}
                        </Typography>
                    </Badge>
                ))}
            </div>
        </div>
    )
})
