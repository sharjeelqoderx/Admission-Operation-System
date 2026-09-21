"use client"

import { memo, useCallback } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Pencil, Printer } from "lucide-react"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { DetailPageSkeleton } from "@/components/shared/page-skeleton"
import { Button } from "@/components/ui/button"
import { fetchDocumentTemplate } from "@/lib/document-template/client"
import { documentTemplateQueryKey } from "@/lib/document-template/query-cache"
import { DocumentTemplateAttachedPrograms } from "../../_components/document-template-attached-programs"
import { DocumentTemplateDetailError } from "../../_components/document-template-detail-error"
import { DocumentTemplatePreview } from "../../_components/document-template-preview"

type ViewPageContentProps = {
    templateId: string
    canEditTemplate: boolean
}

export const ViewPageContent = memo(function ViewPageContent({
    templateId,
    canEditTemplate,
}: ViewPageContentProps) {
    const templateQuery = useQuery({
        queryKey: documentTemplateQueryKey(templateId),
        queryFn: () => fetchDocumentTemplate(templateId),
        enabled: Boolean(templateId),
    })

    const handlePrint = useCallback(() => {
        window.print()
    }, [])

    if (templateQuery.isLoading) {
        return <DetailPageSkeleton />
    }

    if (templateQuery.isError || !templateQuery.data?.data) {
        return (
            <DocumentTemplateDetailError
                message={
                    templateQuery.error instanceof Error
                        ? templateQuery.error.message
                        : "Document template not found."
                }
                onRetry={() => templateQuery.refetch()}
            />
        )
    }

    const template = templateQuery.data.data

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
                        <Button type="button" variant="outline" className="gap-2" asChild>
                            <Link href="/dashboard/templates">
                                <ArrowLeft className="size-4" />
                                Back to list
                            </Link>
                        </Button>
                        <Typography as="h1" font="sub-heading" className="font-bold tracking-tight pt-4">
                            View Document Template
                        </Typography>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {canEditTemplate ? (
                            <Button type="button" variant="outline" className="gap-2" asChild>
                                <Link href={`/dashboard/templates/${templateId}/edit`}>
                                    <Pencil className="size-4" />
                                    Edit
                                </Link>
                            </Button>
                        ) : null}
                        <Button type="button" variant="outline" className="gap-2" onClick={handlePrint}>
                            <Printer className="size-4" />
                            Print / Save as PDF
                        </Button>
                    </div>
                </div>

                <DocumentTemplateAttachedPrograms programs={template.courses} />

                <DocumentTemplatePreview
                    title={template.title}
                    bodyHtml={template.body_html}
                    locale={template.locale}
                    templateDates={template.template_dates}
                    watermark={template.watermark}
                    useSampleData
                    printable
                />
            </BluryCard>
        </main>
    )
})
