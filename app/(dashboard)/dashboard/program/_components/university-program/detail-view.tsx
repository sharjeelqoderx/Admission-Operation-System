"use client"

import { memo } from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Typography } from "@/components/shared/Typography"
import { formatProgramDate, formatStudyMode } from "@/lib/utils/program"
import type { UniversityProgramDetail } from "@/types/schemas/university-program"

type UniversityProgramDetailViewProps = {
    detail: UniversityProgramDetail
    canEditProgram: boolean
}

function FieldLabel({ children }: { children: string }) {
    return (
        <Typography as="p" font="small" className="mb-1 uppercase tracking-widest text-gray-400">
            {children}
        </Typography>
    )
}

function DetailField({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="space-y-1">
            <FieldLabel>{label}</FieldLabel>
            <Typography as="p" font="sub-text" className="font-semibold text-brand-primary">
                {value?.trim() ? value : "—"}
            </Typography>
        </div>
    )
}

function DetailTextBlock({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="space-y-2">
            <FieldLabel>{label}</FieldLabel>
            <Typography as="p" font="sub-text" className="whitespace-pre-wrap leading-relaxed text-gray-700">
                {value?.trim() ? value : "—"}
            </Typography>
        </div>
    )
}

export const UniversityProgramDetailView = memo(function UniversityProgramDetailView({
    detail,
    canEditProgram,
}: UniversityProgramDetailViewProps) {
    const tuitionLabel = detail.tuition_fees
        ? detail.tuition_fees.toLowerCase().includes("tuition")
            ? detail.tuition_fees
            : `Tuition Fees ${detail.tuition_fees}`
        : null

    return (
        <div className="mx-auto max-w-[1200px] space-y-8 px-4 pb-20 pt-4 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/program">
                        <Button variant="outline" size="icon" className="size-9 rounded-full sm:size-10">
                            <ChevronLeft className="size-5" />
                        </Button>
                    </Link>
                    <Typography as="span" font="sub-text" className="font-medium text-gray-500">
                        Back to Programs
                    </Typography>
                </div>

                {canEditProgram ? (
                    <Link href={`/dashboard/program/${detail.id}/edit`}>
                        <Button className="h-11 rounded-xl bg-brand-byzantine px-6 font-semibold hover:bg-brand-byzantine/90">
                            Edit Program
                        </Button>
                    </Link>
                ) : null}
            </div>

            <div className="space-y-2">
                <Typography as="h2" font="sub-heading" className="font-bold text-brand-primary">
                    {detail.name}
                </Typography>
                {detail.category ? (
                    <Typography as="p" font="text" className="font-semibold text-brand-primary">
                        {detail.category}
                    </Typography>
                ) : null}
            </div>

            <Card className="space-y-8 border-none bg-white/80 px-5 py-6 shadow-sm ring-1 ring-black/5 backdrop-blur-lg">
                <div className="flex flex-wrap gap-3">
                    {tuitionLabel ? (
                        <Typography
                            as="span"
                            font="small"
                            className="rounded-xl bg-brand-blue/10 px-3 py-2 font-semibold text-brand-blue"
                        >
                            {tuitionLabel}
                        </Typography>
                    ) : null}
                    {detail.agent_commission != null ? (
                        <Typography
                            as="span"
                            font="small"
                            className="rounded-xl bg-brand-success/10 px-3 py-2 font-semibold text-brand-success"
                        >
                            {detail.agent_commission}% Commission
                        </Typography>
                    ) : null}
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <DetailField label="Program Name" value={detail.name} />
                    <DetailField label="Category" value={detail.category} />
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    <DetailField label="Tuition Fees" value={detail.tuition_fees} />
                    <DetailField
                        label="University Partner Commission"
                        value={
                            detail.agent_commission != null
                                ? `${detail.agent_commission}%`
                                : null
                        }
                    />
                    <DetailField label="Location" value={detail.location} />
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    <DetailField label="Program Length" value={detail.program_length} />
                    <DetailField
                        label="Study Type"
                        value={formatStudyMode(detail.study_type)}
                    />
                    <DetailField
                        label="Intake Date"
                        value={detail.intake_date ? formatProgramDate(detail.intake_date) : null}
                    />
                </div>

                <DetailField
                    label="Application Deadline"
                    value={
                        detail.application_deadline
                            ? formatProgramDate(detail.application_deadline)
                            : null
                    }
                />

                <DetailTextBlock label="Program Detail" value={detail.program_detail} />
                <DetailTextBlock label="Admission Requirements" value={detail.admission_requirements} />
                <DetailTextBlock label="Perspectives" value={detail.perspectives} />

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <DetailTextBlock
                        label="Your Prospect After Graduation"
                        value={detail.prospects_after_graduation}
                    />
                    <DetailTextBlock label="Our Competency Model" value={detail.competency_model} />
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <DetailTextBlock label="Professional Skills" value={detail.professional_skills} />
                    <DetailTextBlock label="Management Skills" value={detail.management_skills} />
                </div>

                <div className="space-y-3">
                    <FieldLabel>Required Documents</FieldLabel>
                    {detail.document_requirements.length === 0 ? (
                        <Typography as="p" font="sub-text" className="text-gray-500">
                            No document requirements added.
                        </Typography>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {detail.document_requirements.map((document) => (
                                <Typography
                                    key={document.id}
                                    as="span"
                                    font="small"
                                    className="rounded-full bg-brand-byzantine/10 px-4 py-2 font-semibold text-brand-byzantine"
                                >
                                    {document.name ?? "Document"}
                                </Typography>
                            ))}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )
})
