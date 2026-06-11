
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
    DegreeDocumentBundle,
} from "@/types/schemas/document"
import {
    Clock,
    ChevronLeft,
    FileText,
    GraduationCap,
    MapPin,
    Upload,
} from "lucide-react"
import Link from "next/link"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

import { AlertCircle, Pencil, Plus } from "lucide-react"

type PendingEntry = {
    front: File | null
    note: string
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
        return [
            {
                id: degree.level.id,
                name: degree.level.name,
            },
        ]
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

function getPendingEntry(
    map: PendingFilesMap,
    documentTypeId: string
): PendingEntry {
    return (
        map[getPendingKey(documentTypeId)] ?? {
            front: null,
            note: "",
        }
    )
}

function hasPendingFiles(entry: PendingEntry) {
    return Boolean(entry.front)
}

function entryToFiles(entry: PendingEntry): File[] {
    const files: File[] = []

    if (entry.front) {
        files.push(entry.front)
    }

    return files
}

type DegreeAccordionItemProps = {
    bundle: DegreeDocumentBundle
    pendingFiles: PendingFilesMap
    onPendingChange: (
        documentTypeId: string,
        entry: PendingEntry
    ) => void

    onSave: (
        degreeId: string,
        uploads: Array<{
            document_type_id: string
            files: File[]
            note: string
        }>
    ) => void

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
                    const entry = getPendingEntry(
                        pendingFiles,
                        requirement.document_type_id
                    )

                    return {
                        document_type_id:
                            requirement.document_type_id,

                        files: entryToFiles(entry),

                        note: entry.note,
                    }
                })
                .filter((item) => item.files.length > 0),

        [bundle.required_documents, pendingFiles]
    )

    const handleSave = useCallback(() => {
        onSave(bundle.degree.id, pendingUploads)
    }, [bundle.degree.id, onSave, pendingUploads])

    return (
        <AccordionItem value={bundle.degree.id}>

            <AccordionTrigger className="hover:no-underline text-base font-normal">

                <div className="flex flex-1 flex-col gap-3 pr-4 text-left">

                    <div className="flex flex-wrap items-center gap-2">

                        <GraduationCap className="size-5 text-brand-byzantine" />

                        <Typography
                            as="span"
                            font="text-lg"
                            className="text-gray-900 font-bold"
                        >
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
                            <Typography
                                as="span"
                                font="small"
                                className="flex items-center gap-1 text-gray-600 font-normal"
                            >
                                <MapPin className="size-3.5" />
                                {bundle.degree.location}
                            </Typography>
                        )}

                        {bundle.degree.duration && (
                            <Typography
                                as="span"
                                font="small"
                                className="flex items-center gap-1 text-gray-600 font-normal"
                            >
                                <Clock className="size-3.5" />
                                {bundle.degree.duration}
                            </Typography>
                        )}

                        {bundle.degree.study_mode && (
                            <Typography
                                as="span"
                                font="small"
                                className="text-gray-600 font-normal"
                            >
                                {formatStudyMode(bundle.degree.study_mode)}
                            </Typography>
                        )}

                    </div>

                    <div className="max-w-md">

                        <div className="flex items-center justify-between gap-3">

                            <Typography
                                as="span"
                                font="small"
                                className="text-gray-600 font-normal"
                            >
                                {`${bundle.uploaded_count}/${bundle.total_required} documents uploaded`}
                            </Typography>

                            <Typography
                                as="span"
                                font="text"
                                className="font-semibold text-brand-byzantine"
                            >
                                {`${bundle.completion_percentage}%`}
                            </Typography>

                        </div>

                        <Progress
                            value={bundle.completion_percentage}
                            className="h-1"
                        />

                    </div>

                </div>

            </AccordionTrigger>

            <AccordionContent className="space-y-6">

                <div className="space-y-3">

                    <Typography
                        as="h3"
                        font="text-lg"
                        className="text-gray-800 font-bold"
                    >
                        Required documents
                    </Typography>

                    {bundle.required_documents.length === 0 ? (

                        <Typography
                            font="sub-text"
                            className="text-gray-500"
                        >
                            No required documents configured for this degree.
                        </Typography>

                    ) : (

                        <div className="overflow-x-auto rounded-2xl border border-gray-200">

                            <table className="w-full min-w-[1200px]">

                                <thead className="bg-gray-50 border-b">

                                    <tr>

                                        <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                            Last Updated
                                        </th>

                                        <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                            Document Name
                                        </th>

                                        <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                            Required
                                        </th>

                                        <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                            Upload File
                                        </th>

                                        <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                            Status
                                        </th>

                                        <th className="text-left p-4 text-sm font-semibold text-gray-700">
                                            Note
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {bundle.required_documents.map(
                                        (requirement) => {

                                            const entry =
                                                getPendingEntry(
                                                    pendingFiles,
                                                    requirement.document_type_id
                                                )

                                            const uploaded =
                                                requirement.uploaded

                                            const uploadedFrontUrl =
                                                uploaded?.files?.[0]
                                                    ?.file_url ?? null

                                            const hasFile = Boolean(
                                                entry.front ||
                                                uploadedFrontUrl
                                            )

                                            return (

                                                <tr
                                                    key={
                                                        requirement.requirement_id
                                                    }
                                                    className="border-b align-top"
                                                >

                                                    {/* Last Updated */}
                                                    <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                                                        {uploaded?.updated_at
                                                            ? new Date(
                                                                uploaded.updated_at
                                                            ).toLocaleDateString()
                                                            : "-"}

                                                    </td>

                                                    {/* Document Name */}
                                                    <td className="p-4 min-w-[240px]">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="size-4 text-brand-byzantine" />
                                                                <Typography
                                                                    font="text"
                                                                    className="font-semibold text-gray-900"
                                                                >
                                                                    {
                                                                        requirement.name
                                                                    }
                                                                </Typography>

                                                            </div>

                                                            {requirement.description && (

                                                                <Typography
                                                                    font="small"
                                                                    className="text-gray-500"
                                                                >
                                                                    {
                                                                        requirement.description
                                                                    }
                                                                </Typography>

                                                            )}

                                                        </div>

                                                    </td>

                                                    {/* Required */}

                                                    <td className="p-4">

                                                        <Badge
                                                            variant="outline"
                                                            className="border-amber-300 text-amber-700"
                                                        >
                                                            Required
                                                        </Badge>

                                                    </td>

                                                    {/* Upload */}

                                                    <td className="p-4 min-w-[320px]">

                                                        <div className="flex items-center gap-3">

                                                            <label
                                                                htmlFor={`upload-${requirement.document_type_id}`}
                                                                className="size-10 rounded-lg border border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-brand-byzantine transition-colors"
                                                            >
                                                                <Upload className="size-4 text-gray-600" />
                                                            </label>

                                                            <input
                                                                id={`upload-${requirement.document_type_id}`}
                                                                type="file"
                                                                className="hidden"
                                                                accept="image/*,application/pdf,.doc,.docx"
                                                                onChange={(e) => {

                                                                    const file =
                                                                        e.target.files?.[0] ?? null

                                                                    onPendingChange(
                                                                        requirement.document_type_id,
                                                                        {
                                                                            ...entry,
                                                                            front: file,
                                                                        }
                                                                    )
                                                                }}
                                                            />

                                                            <div className="flex flex-col">

                                                                <span className="text-sm font-medium text-gray-700">

                                                                    {entry.front
                                                                        ? entry.front.name
                                                                        : uploadedFrontUrl
                                                                            ? "File uploaded"
                                                                            : "No file selected"}

                                                                </span>

                                                                {entry.front && (

                                                                    <span className="text-xs text-gray-500">

                                                                        {(
                                                                            entry.front.size /
                                                                            1024 /
                                                                            1024
                                                                        ).toFixed(2)}{" "}
                                                                        MB

                                                                    </span>

                                                                )}

                                                            </div>

                                                        </div>

                                                    </td>

                                                    {/* Status */}

                                                    <td className="p-4">

                                                        {uploaded ? (

                                                            <Badge
                                                                variant="outline"
                                                                className={cn(
                                                                    "text-[10px] uppercase tracking-wide",
                                                                    getDocumentStatusBadgeClass(
                                                                        uploaded.status
                                                                    )
                                                                )}
                                                            >
                                                                {formatDocumentStatus(
                                                                    uploaded.status
                                                                )}
                                                            </Badge>

                                                        ) : (

                                                            <Badge
                                                                variant="secondary"
                                                                className="text-xs"
                                                            >
                                                                {hasFile
                                                                    ? "Ready"
                                                                    : "Pending"}
                                                            </Badge>

                                                        )}

                                                    </td>

                                                    {/* Note */}

                                                    <td className="p-4 min-w-[120px]">

                                                        <div className="flex items-center">

                                                            {/* ADD NOTE */}


                                                            {!entry.note && (

                                                                <Popover>

                                                                    <PopoverTrigger asChild>

                                                                        <button
                                                                            type="button"
                                                                            className="size-9 rounded-lg border border-dashed border-gray-300 flex items-center justify-center hover:border-brand-byzantine transition-colors"
                                                                        >
                                                                            <Plus className="size-4 text-gray-600" />
                                                                        </button>

                                                                    </PopoverTrigger>

                                                                    <PopoverContent
                                                                        align="start"
                                                                        className="w-[220px] space-y-3"
                                                                    >

                                                                        <Typography
                                                                            font="text"
                                                                            className="font-semibold"
                                                                        >
                                                                            Add Note
                                                                        </Typography>

                                                                        <textarea
                                                                            placeholder="Write note..."
                                                                            className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-byzantine"
                                                                            value={entry.note}
                                                                            onChange={(e) =>
                                                                                onPendingChange(
                                                                                    requirement.document_type_id,
                                                                                    {
                                                                                        ...entry,
                                                                                        note: e.target.value,
                                                                                    }
                                                                                )
                                                                            }
                                                                        />

                                                                    </PopoverContent>

                                                                </Popover>
                                                            )}

                                                            {/* VIEW / EDIT NOTE */}

                                                            {entry.note && (

                                                                <div className="flex items-center gap-2">

                                                                    {/* VIEW */}

                                                                    <TooltipProvider>

                                                                        <Tooltip>

                                                                            <TooltipTrigger asChild>

                                                                                <button
                                                                                    type="button"
                                                                                    className="size-9 rounded-lg border border-amber-200 bg-amber-50 flex items-center justify-center"
                                                                                >
                                                                                    <AlertCircle className="size-4 text-amber-600" />
                                                                                </button>

                                                                            </TooltipTrigger>

                                                                            <TooltipContent
                                                                                side="top"
                                                                                className="max-w-[260px]"
                                                                            >
                                                                                <p className="text-sm whitespace-pre-wrap">
                                                                                    {entry.note}
                                                                                </p>
                                                                            </TooltipContent>

                                                                        </Tooltip>

                                                                    </TooltipProvider>

                                                                    {/* EDIT */}

                                                                    <Popover>

                                                                        <PopoverTrigger asChild>

                                                                            <button
                                                                                type="button"
                                                                                className="size-9 rounded-lg border border-gray-200 flex items-center justify-center hover:border-brand-byzantine transition-colors"
                                                                            >
                                                                                <Pencil className="size-4 text-gray-600" />
                                                                            </button>

                                                                        </PopoverTrigger>

                                                                        <PopoverContent
                                                                            align="start"
                                                                            className="w-[320px] space-y-3"
                                                                        >

                                                                            <Typography
                                                                                font="text"
                                                                                className="font-semibold"
                                                                            >
                                                                                Edit Note
                                                                            </Typography>

                                                                            <textarea
                                                                                placeholder="Write note..."
                                                                                className="w-full min-h-[120px] rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-byzantine"
                                                                                value={entry.note}
                                                                                onChange={(e) =>
                                                                                    onPendingChange(
                                                                                        requirement.document_type_id,
                                                                                        {
                                                                                            ...entry,
                                                                                            note: e.target.value,
                                                                                        }
                                                                                    )
                                                                                }
                                                                            />

                                                                        </PopoverContent>

                                                                    </Popover>

                                                                </div>
                                                            )}

                                                        </div>

                                                    </td>


                                                </tr>
                                            )
                                        }
                                    )}

                                </tbody>

                            </table>

                        </div>
                    )}

                </div>

                {bundle.required_documents.length > 0 && (

                    <div className="flex justify-end pt-2">

                        <Button
                            type="button"
                            className="bg-brand-byzantine hover:bg-brand-byzantine/90 gap-2"
                            disabled={
                                pendingUploads.length === 0 ||
                                isSaving
                            }
                            onClick={handleSave}
                        >
                            <Upload className="size-4" />

                            {isSaving &&
                                savingDegreeId === bundle.degree.id
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

    const [pendingFiles, setPendingFiles] =
        useState<PendingFilesMap>({})

    const [savingDegreeId, setSavingDegreeId] =
        useState<string | null>(null)

    const [saveError, setSaveError] =
        useState<string | null>(null)

    const handlePendingChange = useCallback(
        (
            documentTypeId: string,
            entry: PendingEntry
        ) => {

            setPendingFiles((current) => {

                if (!hasPendingFiles(entry)) {

                    const next = { ...current }

                    delete next[
                        getPendingKey(documentTypeId)
                    ]

                    return next
                }

                return {
                    ...current,
                    [getPendingKey(documentTypeId)]: entry,
                }
            })

        },
        []
    )

    const handleSaveDegree = useCallback(
        async (
            degreeId: string,
            uploads: Array<{
                document_type_id: string
                files: File[]
                note: string
            }>
        ) => {

            if (!data?.profile_id || uploads.length === 0)
                return

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
                        delete next[
                            getPendingKey(
                                upload.document_type_id
                            )
                        ]
                    })

                    return next
                })

            } catch (e) {

                setSaveError(
                    e instanceof Error
                        ? e.message
                        : "Failed to save documents"
                )

            } finally {

                setSavingDegreeId(null)

            }

        },
        [data?.profile_id, saveMutation]
    )

    if ((!profileId && userLoading) || isLoading) {
        return (
            <PageLoader label="Loading course documents..." />
        )
    }

    if (isError) {
        return (
            <ErrorView
                message={
                    error instanceof Error
                        ? error.message
                        : "Failed to load course documents."
                }
            />
        )
    }

    const bundles = data?.degree_bundles ?? []

    return (
        <div className="space-y-6">

            <BluryCard
                isCentered={false}
                childClass="space-y-2"
                className="rounded-2xl"
            >

                {showBack && (

                    <Link
                        href="/dashboard/document"
                        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-brand-byzantine transition-colors mb-2"
                    >
                        <ChevronLeft className="size-4" />
                        Back to students
                    </Link>

                )}

                <Typography
                    as="h2"
                    font="sub-heading"
                    className="font-bold tracking-tight"
                >
                    {studentName
                        ? `Course Documents for ${studentName}`
                        : "Course Documents"}
                </Typography>

                <Typography
                    as="p"
                    font="sub-text"
                    className="text-gray-600"
                >
                    Upload required documents for each degree.
                </Typography>

            </BluryCard>

            {saveError && (
                <ErrorView message={saveError} />
            )}

            {bundles.length === 0 ? (

                <BluryCard
                    isCentered={false}
                    className="rounded-2xl"
                >
                    <Typography
                        as="p"
                        font="sub-text"
                        className="text-gray-600"
                    >
                        No courses with degree requirements found.
                    </Typography>
                </BluryCard>

            ) : (

                <BluryCard
                    isCentered={false}
                    childClass="p-0!"
                    className="p-4! py-4! rounded-2xl overflow-hidden"
                >

                    <Accordion
                        type="multiple"
                        className="w-full"
                    >

                        {bundles.map((bundle) => (

                            <DegreeAccordionItem
                                key={bundle.degree.id}
                                bundle={bundle}
                                pendingFiles={pendingFiles}
                                onPendingChange={
                                    handlePendingChange
                                }
                                onSave={handleSaveDegree}
                                isSaving={
                                    saveMutation.isPending
                                }
                                savingDegreeId={
                                    savingDegreeId
                                }
                            />

                        ))}

                    </Accordion>

                </BluryCard>

            )}

        </div>
    )
}