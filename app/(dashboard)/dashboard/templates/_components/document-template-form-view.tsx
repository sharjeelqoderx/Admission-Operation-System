"use client"

import { memo } from "react"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
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
import { DocumentTemplateEditor } from "./document-template-editor"
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
    programId: string | null
    templateId?: string | null
    isSaving: boolean
    formError: string | null
    onTitleChange: (value: string) => void
    onBodyChange: (html: string) => void
    onLocaleChange: (locale: TemplateLocale) => void
    onTemplateDatesChange: (value: DocumentTemplateDates) => void
    onWatermarkChange: (value: DocumentTemplateWatermark) => void
    onProgramChange: (programId: string | null) => void
    onSave: () => void
    saveLabel?: string
}

export const DocumentTemplateFormView = memo(function DocumentTemplateFormView({
    heading,
    backHref = "/dashboard/templates",
    onBack,
    title,
    bodyHtml,
    locale,
    templateDates,
    watermark,
    programId,
    templateId = null,
    isSaving,
    formError,
    onTitleChange,
    onBodyChange,
    onLocaleChange,
    onTemplateDatesChange,
    onWatermarkChange,
    onProgramChange,
    onSave,
    saveLabel = "Save Template",
}: Props) {
    return (
        <main className="relative space-y-6">
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                blendColorClass="bg-white/10"
                childClass="space-y-6"
            >
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

                    <Button
                        type="button"
                        className="gap-2"
                        disabled={isSaving}
                        onClick={onSave}
                    >
                        <Save className="size-4" />
                        {isSaving ? "Saving..." : saveLabel}
                    </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Typography as="label" font="sub-text" className="font-semibold">
                            Template title
                        </Typography>
                        <Input
                            value={title}
                            placeholder="e.g. Admission Offer Letter"
                            onChange={(event) => onTitleChange(event.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Typography as="label" font="sub-text" className="font-semibold">
                            Letter language
                        </Typography>
                        <Select
                            value={locale}
                            onValueChange={(value) => onLocaleChange(value as TemplateLocale)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                                {TEMPLATE_LOCALE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Typography as="p" font="small" className="text-muted-foreground">
                            Salutations, titles, dates, and checklist labels follow this language
                            when the letter is generated.
                        </Typography>
                    </div>
                </div>

                <DocumentTemplateProgramSelect
                    value={programId}
                    excludeTemplateId={templateId}
                    disabled={isSaving}
                    onChange={onProgramChange}
                />

                {formError ? <ErrorView message={formError} /> : null}

                <DocumentTemplateEditor
                    content={bodyHtml}
                    locale={locale}
                    templateDates={templateDates}
                    onTemplateDatesChange={onTemplateDatesChange}
                    watermark={watermark}
                    onWatermarkChange={onWatermarkChange}
                    onChange={onBodyChange}
                />
            </BluryCard>
        </main>
    )
})
