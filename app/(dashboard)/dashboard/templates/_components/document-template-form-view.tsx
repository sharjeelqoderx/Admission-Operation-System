"use client"

import { memo } from "react"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { ErrorView } from "@/components/shared/error-view"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { TEMPLATE_LOCALE_OPTIONS } from "@/lib/document-template/locale"
import type { DocumentTemplateDates } from "@/lib/document-template/date-variables"
import type { DocumentTemplateWatermark } from "@/lib/document-template/watermark"
import type { TemplateLocale } from "@/types/schemas/document-template"
import { DocumentEditor } from "./document-editor"
import { DocumentTemplateProgramSelect } from "./document-template-program-select"

type Props = {
    heading: string
    backHref?: string
    onBack?: () => void
    title: string
    bodyHtml: string
    locale: TemplateLocale
    templateDates: DocumentTemplateDates
    watermark: DocumentTemplateWatermark
    programIds: string[]
    templateId?: string | null
    isSaving: boolean
    formError: string | null
    onTitleChange: (value: string) => void
    onBodyChange: (html: string) => void
    onLocaleChange: (locale: TemplateLocale) => void
    onTemplateDatesChange: (value: DocumentTemplateDates) => void
    onWatermarkChange: (value: DocumentTemplateWatermark) => void
    onProgramIdsChange: (programIds: string[]) => void
    onSave: () => void
    saveLabel?: string
}

/** Create-template form wrapper — edit page uses DocumentEditorPage directly. */
export const DocumentTemplateFormView = memo(function DocumentTemplateFormView({
    heading,
    backHref = "/dashboard/templates",
    onBack,
    title,
    bodyHtml,
    locale,
    templateDates,
    watermark,
    programIds,
    templateId = null,
    isSaving,
    formError,
    onTitleChange,
    onBodyChange,
    onLocaleChange,
    onTemplateDatesChange,
    onWatermarkChange,
    onProgramIdsChange,
    onSave,
    saveLabel = "Save Template",
}: Props) {
    return (
        <main className="relative space-y-6">
            <BluryCard isCentered={false} blurAmount="backdrop-blur-lg" blendColorClass="bg-white/10" childClass="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        {onBack ? (
                            <Button type="button" variant="outline" className="gap-2" onClick={onBack}>
                                <ArrowLeft className="size-4" />
                                Back to list
                            </Button>
                        ) : (
                            <Button type="button" variant="outline" className="gap-2" asChild>
                                <Link href={backHref}>
                                    <ArrowLeft className="size-4" />
                                    Back to list
                                </Link>
                            </Button>
                        )}
                        <Typography as="h1" font="sub-heading" className="font-bold tracking-tight pt-4">
                            {heading}
                        </Typography>
                    </div>
                    <Button type="button" className="gap-2" disabled={isSaving} onClick={onSave}>
                        <Save className="size-4" />
                        {isSaving ? "Saving..." : saveLabel}
                    </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Typography as="label" font="sub-text" className="font-semibold">Template title</Typography>
                        <Input value={title} placeholder="e.g. Admission Offer Letter" onChange={(e) => onTitleChange(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Typography as="label" font="sub-text" className="font-semibold">Letter language</Typography>
                        <Select value={locale} onValueChange={(v) => onLocaleChange(v as TemplateLocale)}>
                            <SelectTrigger><SelectValue placeholder="Select language" /></SelectTrigger>
                            <SelectContent>
                                {TEMPLATE_LOCALE_OPTIONS.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DocumentTemplateProgramSelect
                    value={programIds}
                    excludeTemplateId={templateId}
                    disabled={isSaving}
                    onChange={onProgramIdsChange}
                />

                {formError ? <ErrorView message={formError} /> : null}

                <DocumentEditor
                    bodyHtml={bodyHtml}
                    locale={locale}
                    templateDates={templateDates}
                    watermark={watermark}
                    onBodyChange={onBodyChange}
                    onTemplateDatesChange={onTemplateDatesChange}
                    onWatermarkChange={onWatermarkChange}
                />
            </BluryCard>
        </main>
    )
})
