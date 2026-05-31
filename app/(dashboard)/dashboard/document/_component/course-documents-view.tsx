"use client"

import React, { memo, useCallback, useMemo, useState } from "react"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { PageLoader } from "@/components/shared/page-loader"
import { ErrorView } from "@/components/shared/error-view"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import ImageUploadCard from "@/components/shared/image-upload-card"
import { cn } from "@/lib/utils"
import { formatStudyMode } from "@/lib/utils/program"
import {
    useCourseDocumentBundles,
    useSaveDegreeDocuments,
} from "@/hooks/useCourseDocumentBundles"
import { useAuth } from "@/hooks/useAuth"
import type {
    CourseRequiredDocument,
    DegreeDocumentBundle,
} from "@/types/schemas/document"
import {
    CheckCircle2,
    Clock,
    ChevronLeft,
    FileText,
    GraduationCap,
    MapPin,
    Upload,
} from "lucide-react"
import Link from "next/link"

type PendingEntry = {
    front: File | null
    back: File | null
}

type PendingFilesMap = Record<string, PendingEntry>

function getPendingKey(documentTypeId: string) {
    return documentTypeId
}

function getDegreeLevels(
    degree: DegreeDocumentBundle["degree"]
): Array<{ id: string; name: string }> {
    if (degree.levels?.length) return degree.levels
    if (degree.level?.id) {
        return [{ id: degree.level.id, name: degree.level.name }]
    }
    return []
}

function getDocumentStatusBadgeClass(status: string) {
    switch (status.toUpperCase()) {
        case "VERIFIED":
        case "APPROVED":
            return "border-emerald-200 bg-emerald-50 text-emerald-700"
        case "REJECTED":
            return "border-red-200 bg-red-50 text-red-700"
        case "ACTION_REQUIRED":
        case "NEEDS_REVISION":
            return "border-orange-200 bg-orange-50 text-orange-700"
        case "PENDING":
        default:
            return "border-amber-200 bg-amber-50 text-amber-700"
    }
}

function formatDocumentStatus(status: string) {
    return status.replace(/_/g, " ")
}

function getPendingEntry(map: PendingFilesMap, documentTypeId: string): PendingEntry {
    return map[getPendingKey(documentTypeId)] ?? { front: null, back: null }
}

function hasPendingFiles(entry: PendingEntry) {
    return Boolean(entry.front || entry.back)
}

function entryToFiles(entry: PendingEntry): File[] {
    const files: File[] = []
    if (entry.front) files.push(entry.front)
    if (entry.back) files.push(entry.back)
    return files
}

type DocumentUploadSlotProps = {
    requirement: CourseRequiredDocument
    pendingEntry: PendingEntry
    onPendingChange: (documentTypeId: string, entry: PendingEntry) => void
}

const DocumentUploadSlot = memo(function DocumentUploadSlot({
    requirement,
    pendingEntry,
    onPendingChange,
}: DocumentUploadSlotProps) {
    const uploaded = requirement.uploaded
    const frontFile = pendingEntry.front
    const backFile = pendingEntry.back
    const uploadedFrontUrl = uploaded?.files.find((f) => f.type === "FRONT")?.file_url
        ?? uploaded?.files[0]?.file_url
    const uploadedBackUrl = uploaded?.files.find((f) => f.type === "BACK")?.file_url
        ?? uploaded?.files[1]?.file_url

    const frontDisplayValue = frontFile ?? uploadedFrontUrl ?? null
    const backDisplayValue = backFile ?? uploadedBackUrl ?? null
    const hasFrontSource = Boolean(frontFile || uploadedFrontUrl)

    const handleFrontChange = useCallback(
        (file: File | null) => {
            onPendingChange(requirement.document_type_id, {
                ...pendingEntry,
                front: file,
            })
        },
        [onPendingChange, pendingEntry, requirement.document_type_id]
    )

    const handleBackChange = useCallback(
        (file: File | null) => {
            if (!hasFrontSource && !file) return
            onPendingChange(requirement.document_type_id, {
                ...pendingEntry,
                back: file,
            })
        },
        [hasFrontSource, onPendingChange, pendingEntry, requirement.document_type_id]
    )

    return (
        <div className="rounded-xl border border-white/20 bg-white/10 p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <FileText className="size-4 text-brand-byzantine shrink-0" />
                        <Typography font="text" className="text-gray-900 font-bold">
                            {requirement.name}
                        </Typography>
                        {uploaded ? (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                <CheckCircle2 className="size-3 mr-1" />
                                {frontFile || backFile ? "Selected" : "Uploaded"}
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="border-amber-300 text-amber-700">
                                Required
                            </Badge>
                        )}
                    </div>
                    {requirement.description && (
                        <Typography font="small" className="text-gray-600 font-normal">
                            {requirement.description}
                        </Typography>
                    )}
                </div>
                {uploaded && (
                    <Badge
                        variant="outline"
                        className={cn(
                            "h-5 px-2 text-[10px] font-semibold uppercase tracking-wide",
                            getDocumentStatusBadgeClass(uploaded.status)
                        )}
                    >
                        {formatDocumentStatus(uploaded.status)}
                    </Badge>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <ImageUploadCard
                        value={frontDisplayValue}
                        onChange={(file) => handleFrontChange(file as File | null)}
                        message="required document"
                        accept="image/*,application/pdf,.doc,.docx"
                        className="min-h-[140px]"
                    />
                </div>
                <div className={cn("space-y-2", !hasFrontSource && "opacity-50")}>
                    <ImageUploadCard
                        value={backDisplayValue}
                        onChange={(file) => handleBackChange(file as File | null)}
                        message="back side"
                        accept="image/*,application/pdf,.doc,.docx"
                        className="min-h-[140px]"
                        disabled={!hasFrontSource}
                    />
                </div>
            </div>
        </div>
    )
})

type DegreeAccordionItemProps = {
    bundle: DegreeDocumentBundle
    pendingFiles: PendingFilesMap
    onPendingChange: (documentTypeId: string, entry: PendingEntry) => void
    onSave: (degreeId: string, uploads: Array<{ document_type_id: string; files: File[] }>) => void
    isSaving: boolean
    savingDegreeId: string | null
}

const DegreeAccordionItem = memo(function DegreeAccordionItem({
    bundle,
    pendingFiles,
    onPendingChange,
    onSave,
    isSaving,
    savingDegreeId,
}: DegreeAccordionItemProps) {
    const pendingUploads = useMemo(
        () =>
            bundle.required_documents
                .map((requirement) => {
                    const entry = getPendingEntry(pendingFiles, requirement.document_type_id)
                    return {
                        document_type_id: requirement.document_type_id,
                        files: entryToFiles(entry),
                    }
                })
                .filter((item) => item.files.length > 0),
        [bundle.required_documents, pendingFiles]
    )

    const handleSave = useCallback(() => {
        onSave(bundle.degree.id, pendingUploads)
    }, [bundle.degree.id, onSave, pendingUploads])

    return (
        <AccordionItem value={bundle.degree.id} className="px-4">
            <AccordionTrigger className="hover:no-underline text-base font-normal">
                <div className="flex flex-1 flex-col gap-3 pr-4 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                        <GraduationCap className="size-5 text-brand-byzantine" />
                        <Typography as="span" font="text-lg" className="text-gray-900 font-bold">
                            {bundle.degree.name}
                        </Typography>
                        {getDegreeLevels(bundle.degree).map((level) => (
                            <Badge
                                key={level.id}
                                variant="outline"
                                className="text-[10px] font-medium px-2 py-0 h-5"
                            >
                                {level.name}
                            </Badge>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {bundle.degree.location && (
                            <Typography as="span" font="small" className="flex items-center gap-1 text-gray-600 font-normal">
                                <MapPin className="size-3.5" />
                                {bundle.degree.location}
                            </Typography>
                        )}
                        {bundle.degree.duration && (
                            <Typography as="span" font="small" className="flex items-center gap-1 text-gray-600 font-normal">
                                <Clock className="size-3.5" />
                                {bundle.degree.duration}
                            </Typography>
                        )}
                        {bundle.degree.study_mode && (
                            <Typography as="span" font="small" className="text-gray-600 font-normal">
                                {formatStudyMode(bundle.degree.study_mode)}
                            </Typography>
                        )}
                    </div>
                    <div className="max-w-md">
                        <div className="flex items-center justify-between gap-3">
                            <Typography as="span" font="small" className="text-gray-600 font-normal">
                                {`${bundle.uploaded_count}/${bundle.total_required} documents uploaded`}
                            </Typography>
                            <Typography as="span" font="text" className="font-semibold text-brand-byzantine">
                                {`${bundle.completion_percentage}%`}
                            </Typography>
                        </div>
                        <Progress value={bundle.completion_percentage} className="h-1" />
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-6">
                <div className="space-y-3">
                    <Typography as="h3" font="text-lg" className="text-gray-800 font-bold">
                        Required documents
                    </Typography>
                    {bundle.required_documents.length === 0 ? (
                        <Typography font="sub-text" className="text-gray-500">
                            No required documents configured for this degree.
                        </Typography>
                    ) : (
                        <div className="space-y-4">
                            {bundle.required_documents.map((requirement) => (
                                <DocumentUploadSlot
                                    key={requirement.requirement_id}
                                    requirement={requirement}
                                    pendingEntry={getPendingEntry(
                                        pendingFiles,
                                        requirement.document_type_id
                                    )}
                                    onPendingChange={onPendingChange}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {bundle.required_documents.length > 0 && (
                    <div className="flex justify-end pt-2">
                        <Button
                            type="button"
                            className="bg-brand-byzantine hover:bg-brand-byzantine/90 gap-2"
                            disabled={pendingUploads.length === 0 || isSaving}
                            onClick={handleSave}
                        >
                            <Upload className="size-4" />
                            {isSaving && savingDegreeId === bundle.degree.id
                                ? "Saving..."
                                : "Save Documents"}
                        </Button>
                    </div>
                )}
            </AccordionContent>
        </AccordionItem>
    )
})

type Props = {
    profileId?: string
    studentName?: string
    showBack?: boolean
}

export function CourseDocumentsView({
    profileId,
    studentName,
    showBack = false,
}: Props = {}) {
    const { me } = useAuth()
    const { data: user, isLoading: userLoading } = me

    const resolvedProfileId = profileId ?? user?.id

    const {
        data,
        isLoading,
        isError,
        error,
    } = useCourseDocumentBundles(resolvedProfileId)

    const saveMutation = useSaveDegreeDocuments()
    const [pendingFiles, setPendingFiles] = useState<PendingFilesMap>({})
    const [savingDegreeId, setSavingDegreeId] = useState<string | null>(null)
    const [saveError, setSaveError] = useState<string | null>(null)

    const handlePendingChange = useCallback((documentTypeId: string, entry: PendingEntry) => {
        setPendingFiles((current) => {
            if (!hasPendingFiles(entry)) {
                const next = { ...current }
                delete next[getPendingKey(documentTypeId)]
                return next
            }
            return {
                ...current,
                [getPendingKey(documentTypeId)]: entry,
            }
        })
    }, [])

    const handleSaveDegree = useCallback(
        async (degreeId: string, uploads: Array<{ document_type_id: string; files: File[] }>) => {
            if (!data?.profile_id || uploads.length === 0) return

            setSaveError(null)
            setSavingDegreeId(degreeId)

            try {
                await saveMutation.mutateAsync({
                    profile_id: data.profile_id,
                    uploads,
                })

                setPendingFiles((current) => {
                    const next = { ...current }
                    uploads.forEach((upload) => {
                        delete next[getPendingKey(upload.document_type_id)]
                    })
                    return next
                })
            } catch (e) {
                setSaveError(e instanceof Error ? e.message : "Failed to save documents")
            } finally {
                setSavingDegreeId(null)
            }
        },
        [data?.profile_id, saveMutation]
    )

    if ((!profileId && userLoading) || isLoading) {
        return <PageLoader label="Loading course documents..." />
    }

    if (isError) {
        return (
            <ErrorView
                message={error instanceof Error ? error.message : "Failed to load course documents."}
            />
        )
    }

    const bundles = data?.degree_bundles ?? []

    return (
        <div className="space-y-6">
            <BluryCard isCentered={false} childClass="space-y-2" className="rounded-2xl">
                {showBack && (
                    <Link
                        href="/dashboard/document"
                        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-brand-byzantine transition-colors mb-2"
                    >
                        <ChevronLeft className="size-4" />
                        Back to students
                    </Link>
                )}
                <Typography as="h2" font="sub-heading" className="font-bold tracking-tight">
                    {studentName
                        ? `Course Documents for ${studentName}`
                        : "Course Documents"}
                </Typography>
                <Typography as="p" font="sub-text" className="text-gray-600">
                    Upload required documents for each degree. Documents are saved directly to this student&apos;s profile.
                </Typography>
            </BluryCard>

            {saveError && <ErrorView message={saveError} />}

            {bundles.length === 0 ? (
                <BluryCard isCentered={false} className="rounded-2xl">
                    <Typography as="p" font="sub-text" className="text-gray-600">
                        No courses with degree requirements found.
                    </Typography>
                </BluryCard>
            ) : (
                <BluryCard isCentered={false} childClass="p-0" className="rounded-2xl overflow-hidden">
                    <Accordion type="multiple" className="w-full">
                        {bundles.map((bundle) => (
                            <DegreeAccordionItem
                                key={bundle.degree.id}
                                bundle={bundle}
                                pendingFiles={pendingFiles}
                                onPendingChange={handlePendingChange}
                                onSave={handleSaveDegree}
                                isSaving={saveMutation.isPending}
                                savingDegreeId={savingDegreeId}
                            />
                        ))}
                    </Accordion>
                </BluryCard>
            )}
        </div>
    )
}
