"use client"

import { useCallback, useState } from "react"
import Link from "next/link"
import { useQueryClient } from "@tanstack/react-query"
import { Typography } from "@/components/shared/Typography"
import { ErrorView } from "@/components/shared/error-view"
import { PageLoader } from "@/components/shared/page-loader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useCourseDocumentBundles } from "@/hooks/useCourseDocumentBundles"
import { useAuth } from "@/hooks/useAuth"
import { isUniversityViewOnly } from "@/lib/auth/is-university-view-only"
import { formatStudyMode } from "@/lib/utils/program"
import { ChevronLeft, Clock, GraduationCap, MapPin } from "lucide-react"
import { DegreeDocumentsTable } from "./degree-documents-table"
import {
    formatDocumentLastUpdated,
    getDegreeDocumentStats,
    getDegreeLevels,
    type PendingEntry,
    type PendingFilesMap,
} from "./degree-documents-shared"

type Props = {
    studentId: string
    degreeId: string
    variant?: "modal" | "page"
}

export function DegreeDocumentsPanel({
    studentId,
    degreeId,
    variant = "page",
}: Props) {
    const queryClient = useQueryClient()
    const { me } = useAuth()
    const readOnly = isUniversityViewOnly(me.data?.role)
    const { data, isLoading, isError, error } = useCourseDocumentBundles(studentId)

    const [pendingFiles, setPendingFiles] = useState<PendingFilesMap>({})
    const [isSaving, setIsSaving] = useState<Record<string, boolean>>({})
    const [saveError, setSaveError] = useState<string | null>(null)

    const bundle = data?.degree_bundles?.find((b) => b.degree.id === degreeId)

    const handlePendingChange = useCallback(
        (documentTypeId: string, entry: PendingEntry) => {
            setPendingFiles((current) => ({
                ...current,
                [documentTypeId]: entry,
            }))
        },
        []
    )

    const handleSaveRow = useCallback(
        async (
            _degreeId: string,
            documentTypeId: string,
            files: File[],
            _note: string
        ) => {
            if (!data?.profile_id || files.length === 0) return

            setSaveError(null)
            setIsSaving((current) => ({ ...current, [documentTypeId]: true }))

            try {
                const fd = new FormData()
                fd.set("student_id", data.profile_id)
                fd.set("document_type_id", documentTypeId)
                files.forEach((file) => fd.append("files", file))

                const res = await fetch("/api/document", { method: "POST", body: fd })
                if (!res.ok) {
                    const json = await res.json()
                    throw new Error(json.error ?? "Failed to save document")
                }

                setPendingFiles((current) => {
                    const next = { ...current }
                    delete next[documentTypeId]
                    return next
                })

                await queryClient.invalidateQueries({
                    queryKey: ["course-document-bundles"],
                })
                await queryClient.invalidateQueries({ queryKey: ["documents"] })
                await queryClient.invalidateQueries({ queryKey: ["documents", "all"] })
                await queryClient.invalidateQueries({ queryKey: ["documents", "students"] })
            } catch (e) {
                setSaveError(
                    e instanceof Error ? e.message : "Failed to save documents"
                )
            } finally {
                setIsSaving((current) => ({ ...current, [documentTypeId]: false }))
            }
        },
        [data?.profile_id, queryClient]
    )

    if (isLoading) {
        return <PageLoader />
    }

    if (isError) {
        return (
            <ErrorView
                message={
                    error instanceof Error
                        ? error.message
                        : "Failed to load documents."
                }
            />
        )
    }

    if (!bundle) {
        return (
            <div className="py-12 text-center text-gray-500">
                Program not found or has no document requirements.
            </div>
        )
    }

    const levels = getDegreeLevels(bundle.degree)
    const documentStats = getDegreeDocumentStats(bundle)

    return (
        <div className="space-y-6">
            {variant === "page" && (
                <Link
                    href={`/dashboard/document/student/${studentId}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-brand-byzantine transition-colors"
                >
                    <ChevronLeft className="size-4" />
                    Back to courses
                </Link>
            )}

            <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                    <GraduationCap className="size-5 text-brand-byzantine" />
                    <Typography as="h2" font="text-lg" className="font-bold text-gray-900">
                        {bundle.degree.name}
                    </Typography>
                    {levels.map((level) => (
                        <Badge
                            key={level.id}
                            variant="outline"
                            className="text-[10px] font-medium px-2 py-0 h-5"
                        >
                            {level.name}
                        </Badge>
                    ))}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {bundle.degree.location && (
                        <span className="flex items-center gap-1">
                            <MapPin className="size-3.5" />
                            {bundle.degree.location}
                        </span>
                    )}
                    {bundle.degree.duration && (
                        <span className="flex items-center gap-1">
                            <Clock className="size-3.5" />
                            {bundle.degree.duration}
                        </span>
                    )}
                    {bundle.degree.study_mode && (
                        <span>{formatStudyMode(bundle.degree.study_mode)}</span>
                    )}
                </div>

                {/* {bundle.courses.length > 0 && (
                    <div className="text-sm text-gray-600">
                        <span className="font-medium text-gray-800">Program: </span>
                        {bundle.courses.map((c) => c.name).join(", ")}
                    </div>
                )} */}

                <div className="max-w-md space-y-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-gray-600">
                            {documentStats.uploaded_count}/{documentStats.total_required}{" "}
                            documents uploaded
                        </span>
                        <span className="font-semibold text-brand-byzantine">
                            {documentStats.completion_percentage}%
                        </span>
                    </div>
                    <Progress value={documentStats.completion_percentage} className="h-1.5" />
                </div>
            </div>

            {saveError && <ErrorView message={saveError} />}

            <div className="space-y-3">
                <Typography as="h3" font="text-lg" className="font-bold text-gray-800">
                    Required documents
                </Typography>
                <DegreeDocumentsTable
                    bundle={bundle}
                    pendingFiles={pendingFiles}
                    onPendingChange={handlePendingChange}
                    isSaving={isSaving}
                    onSaveRow={handleSaveRow}
                    readOnly={readOnly}
                />
            </div>

            {variant === "page" && (
                <div className="flex justify-end pt-2">
                    <Button variant="outline" asChild>
                        <Link href={`/dashboard/document/student/${studentId}`}>
                            Done
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    )
}
