"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Typography } from "@/components/shared/Typography"
import { ErrorView } from "@/components/shared/error-view"
import { FilePreview } from "@/components/shared/FilePreview"
import { useAuth } from "@/hooks/useAuth"
import { PageLoader, Spinner } from "@/components/shared/page-loader"
import { useDegrees } from "@/hooks/useDegrees"
import { useLevels } from "@/hooks/useLevels"
import { filterCoursesByQualificationLevel } from "@/lib/utils/levels"
import { resolveCourseDocumentTypes } from "@/lib/utils/course-documents"
import { resolveApsDocumentType, withApsRequiredDocument } from "@/lib/utils/aps"
import { formatProgramDate } from "@/lib/utils/program"
import type { CourseProgram } from "@/types/schemas/program"
import { FileText, Plus } from "lucide-react"
import { ImageUploadCard } from "@/components/shared/image-upload-card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type Document = {
    id: string
    name: string
    created_at: string
    document_type_id?: string
    document_type?: { id: string; name: string }
    document_files?: { file_url: string }[]
}

function hasUploadedDocument(
    documentTypeId: string,
    pendingFiles: Record<string, { front: File | null; back: File | null }>,
    documents: Document[]
): boolean {
    if (pendingFiles[documentTypeId]?.front) return true
    return documents.some(
        (doc) => (doc.document_type?.id ?? doc.document_type_id) === documentTypeId
    )
}

function RequiredDocumentTitle({
    name,
    className,
}: {
    name: string
    className?: string
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className="block w-full min-w-0 cursor-default">
                    <Typography
                        as="p"
                        className={cn(
                            "text-[11px] font-bold text-gray-900 line-clamp-2 break-words leading-snug",
                            className
                        )}
                    >
                        {name}
                    </Typography>
                </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-left">
                {name}
            </TooltipContent>
        </Tooltip>
    )
}

function SupportingDocumentUploadModal({
    open,
    onOpenChange,
    studentId,
    documentType,
    onUploaded,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    studentId: string
    documentType: { id: string; name: string } | null
    onUploaded: () => void
}) {
    const [frontFile, setFrontFile] = useState<File | null>(null)
    const [backFile, setBackFile] = useState<File | null>(null)
    const queryClient = useQueryClient()

    const uploadMutation = useMutation({
        mutationFn: async () => {
            if (!studentId || !documentType?.id || !frontFile) {
                throw new Error("Please upload the front side file")
            }

            const formData = new FormData()
            formData.set("student_id", studentId)
            formData.set("document_type_id", documentType.id)
            formData.append("files", frontFile)
            if (backFile) {
                formData.append("files", backFile)
            }

            const res = await fetch("/api/document", { method: "POST", body: formData })
            const json = await res.json()
            if (!res.ok) {
                throw new Error(json.error ?? "Failed to upload document")
            }

            return json.data as { id: string }
        },
        onSuccess: () => {
            toast.success("Document uploaded successfully")
            queryClient.invalidateQueries({ queryKey: ["onboarding-documents"], exact: false })
            onUploaded()
            setFrontFile(null)
            setBackFile(null)
            onOpenChange(false)
        },
        onError: (error: Error) => {
            toast.error(error.message)
        },
    })

    const handleOpenChange = useCallback(
        (nextOpen: boolean) => {
            if (uploadMutation.isPending) return
            if (!nextOpen) {
                setFrontFile(null)
                setBackFile(null)
            }
            onOpenChange(nextOpen)
        },
        [onOpenChange, uploadMutation.isPending]
    )

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Upload {documentType?.name ?? "Document"}</DialogTitle>
                    <DialogDescription>
                        Add the required file for this document type.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
                    <div className="space-y-2">
                        <Typography font="small" className="text-gray-400 uppercase tracking-widest">
                            Front Side
                        </Typography>
                        <ImageUploadCard
                            value={frontFile}
                            onChange={setFrontFile}
                            message="Front File"
                            accept="image/*,application/pdf,.doc,.docx"
                            className="min-h-[160px] border-2 border-transparent hover:border-brand-byzantine bg-gray-50/50 hover:bg-gray-100/50 transition-all"
                            emptyIcon={<Plus size={32} className="text-gray-300" />}
                        />
                    </div>

                    <div className={cn("space-y-2 transition-opacity", !frontFile && "opacity-50")}>
                        <Typography font="small" className="text-gray-400 uppercase tracking-widest">
                            Back Side (Optional)
                        </Typography>
                        <ImageUploadCard
                            value={backFile}
                            onChange={(file) => {
                                if (!frontFile && file) return
                                setBackFile(file)
                            }}
                            message="Back File"
                            accept="image/*,application/pdf,.doc,.docx"
                            disabled={!frontFile}
                            className={cn(
                                "min-h-[160px] border-2 border-dashed border-gray-200 bg-gray-50/50 hover:bg-gray-100/50 hover:border-brand-byzantine/30 transition-all",
                                !frontFile && "cursor-not-allowed pointer-events-none"
                            )}
                            emptyIcon={<Plus size={32} className="text-gray-300" />}
                        />
                    </div>
                </div>

                {uploadMutation.error instanceof Error && (
                    <ErrorView message={uploadMutation.error.message} />
                )}

                <DialogFooter className="gap-2 sm:gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={uploadMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={() => uploadMutation.mutate()}
                        disabled={!frontFile || uploadMutation.isPending}
                        className="bg-brand-byzantine hover:bg-brand-byzantine/90"
                    >
                        {uploadMutation.isPending ? (
                            <>
                                <Spinner size="sm" />
                                Uploading...
                            </>
                        ) : (
                            "Save & Upload"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function SupportingDocumentsSection({
    documents,
    requiredDocTypes,
    optionalDocTypes,
    studentId,
    refetchDocuments,
    pendingFiles,
    setPendingFiles,
    isUploading,
    isDocumentsLoading,
}: {
    documents: Document[]
    requiredDocTypes: { id: string; name: string }[]
    optionalDocTypes: { id: string; name: string }[]
    studentId: string
    refetchDocuments: () => Promise<unknown>
    pendingFiles: Record<string, { front: File | null; back: File | null }>
    setPendingFiles: React.Dispatch<React.SetStateAction<Record<string, { front: File | null; back: File | null }>>>
    isUploading: Record<string, boolean>
    isDocumentsLoading?: boolean
}) {
    const [localUploadModalOpen, setLocalUploadModalOpen] = useState(false)
    const [activeDocumentType, setActiveDocumentType] = useState<{ id: string; name: string } | null>(null)
    const [tempFront, setTempFront] = useState<File | null>(null)
    const [tempBack, setTempBack] = useState<File | null>(null)

    const openLocalUploadModal = useCallback((documentType: { id: string; name: string }) => {
        setActiveDocumentType(documentType)
        setTempFront(pendingFiles[documentType.id]?.front || null)
        setTempBack(pendingFiles[documentType.id]?.back || null)
        setLocalUploadModalOpen(true)
    }, [pendingFiles])

    const handleLocalUploadSave = useCallback(() => {
        if (activeDocumentType) {
            setPendingFiles((prev) => ({
                ...prev,
                [activeDocumentType.id]: { front: tempFront, back: tempBack },
            }))
        }
        setLocalUploadModalOpen(false)
        setTempFront(null)
        setTempBack(null)
    }, [activeDocumentType, tempFront, tempBack, setPendingFiles])

    const handleDocumentUploaded = useCallback(async () => {
        await refetchDocuments()
    }, [refetchDocuments])

    const renderDocumentCards = useCallback(
        (docTypes: { id: string; name: string }[], isRequired: boolean) => (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {docTypes.map((rt) => {
                    const doc = documents.find(
                        (d) => (d.document_type?.id ?? d.document_type_id) === rt.id
                    )
                    const hasPending = pendingFiles[rt.id]?.front

                    if (isUploading[rt.id]) {
                        return (
                            <div
                                key={rt.id}
                                className="bg-[#f8f9fc] rounded-xl p-3 space-y-3 relative border-2 border-purple-400 bg-purple-50/30 shadow-md cursor-not-allowed"
                            >
                                <div className="absolute top-3 left-3 z-10">
                                    <Spinner size="sm" />
                                </div>
                                <div className="aspect-square bg-white rounded-lg flex items-center justify-center overflow-hidden border border-gray-100 shadow-inner">
                                    <Spinner size="lg" className="size-10" />
                                </div>
                                <div>
                                    <RequiredDocumentTitle name={rt.name} />
                                    <Typography as="p" className="text-[8px] font-bold tracking-widest text-purple-600 uppercase mt-1">
                                        Uploading...
                                    </Typography>
                                </div>
                            </div>
                        )
                    }

                    if (doc) {
                        return (
                            <div
                                key={rt.id}
                                className="bg-[#f8f9fc] rounded-xl p-3 space-y-3 relative border border-green-500 bg-green-50/30 shadow-md"
                            >
                                <div className="aspect-square bg-white rounded-lg flex items-center justify-center overflow-hidden border border-gray-100 shadow-inner">
                                    {doc.document_files?.[0]?.file_url ? (
                                        <FilePreview
                                            url={doc.document_files[0].file_url}
                                            name={rt.name}
                                            showActions={false}
                                            className="border-none shadow-none size-full"
                                        />
                                    ) : (
                                        <FileText className="size-10 text-green-500" />
                                    )}
                                </div>
                                <div>
                                    <RequiredDocumentTitle name={rt.name} />
                                    <Typography as="p" className="text-[8px] font-bold tracking-widest text-green-600 uppercase mt-1">
                                        Attached
                                    </Typography>
                                </div>
                            </div>
                        )
                    }

                    if (hasPending) {
                        return (
                            <button
                                key={rt.id}
                                type="button"
                                onClick={() => openLocalUploadModal(rt)}
                                className="bg-[#f8f9fc] rounded-xl p-3 space-y-3 relative border-2 border-yellow-400 bg-yellow-50/30 shadow-md w-full text-left"
                            >
                                <div className="aspect-square bg-white rounded-lg flex items-center justify-center overflow-hidden border border-gray-100 shadow-inner">
                                    <FileText className="size-10 text-yellow-500" />
                                </div>
                                <div>
                                    <RequiredDocumentTitle name={rt.name} />
                                    <Typography as="p" className="text-[8px] font-bold tracking-widest text-yellow-600 uppercase mt-1">
                                        Ready to upload
                                    </Typography>
                                </div>
                            </button>
                        )
                    }

                    return (
                        <button
                            key={rt.id}
                            type="button"
                            onClick={() => openLocalUploadModal(rt)}
                            className={cn(
                                "rounded-xl p-3 space-y-3 relative border-2 border-dashed flex flex-col items-center justify-center gap-2 min-h-[140px] transition-all w-full",
                                isRequired
                                    ? "bg-red-50/50 border-red-200 hover:bg-red-50 hover:border-red-300"
                                    : "bg-gray-50/50 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                            )}
                        >
                            <div
                                className={cn(
                                    "size-10 rounded-full flex items-center justify-center",
                                    isRequired ? "bg-red-100" : "bg-gray-100"
                                )}
                            >
                                <FileText className={cn("size-5", isRequired ? "text-red-400" : "text-gray-400")} />
                            </div>
                            <div className="text-center w-full min-w-0 px-1">
                                <RequiredDocumentTitle
                                    name={rt.name}
                                    className={cn("text-center", isRequired ? "text-red-600" : "text-gray-700")}
                                />
                                <Typography
                                    as="p"
                                    className={cn("text-[9px] mt-0.5", isRequired ? "text-red-400" : "text-gray-400")}
                                >
                                    {isRequired ? "Required — click to upload" : "Optional — click to upload"}
                                </Typography>
                            </div>
                        </button>
                    )
                })}
            </div>
        ),
        [documents, pendingFiles, isUploading, openLocalUploadModal]
    )

    return (
        <TooltipProvider delayDuration={200}>
        <>
            {studentId ? (
                <SupportingDocumentUploadModal
                    open={localUploadModalOpen}
                    onOpenChange={setLocalUploadModalOpen}
                    studentId={studentId}
                    documentType={activeDocumentType}
                    onUploaded={handleDocumentUploaded}
                />
            ) : (
                activeDocumentType && (
                    <Dialog open={localUploadModalOpen} onOpenChange={setLocalUploadModalOpen}>
                        <DialogContent className="sm:max-w-xl">
                            <DialogHeader>
                                <DialogTitle>Upload {activeDocumentType.name}</DialogTitle>
                                <DialogDescription>
                                    Add the required file for this document type.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
                                <div className="space-y-2">
                                    <Typography font="small" className="text-gray-400 uppercase tracking-widest">
                                        Front Side
                                    </Typography>
                                    <ImageUploadCard
                                        value={tempFront}
                                        onChange={setTempFront}
                                        message="Front File"
                                        accept="image/*,application/pdf,.doc,.docx"
                                        className="min-h-[160px] border-2 border-transparent hover:border-brand-byzantine bg-gray-50/50 hover:bg-gray-100/50 transition-all"
                                        emptyIcon={<Plus size={32} className="text-gray-300" />}
                                    />
                                </div>

                                <div className={cn("space-y-2 transition-opacity", !tempFront && "opacity-50")}>
                                    <Typography font="small" className="text-gray-400 uppercase tracking-widest">
                                        Back Side (Optional)
                                    </Typography>
                                    <ImageUploadCard
                                        value={tempBack}
                                        onChange={(file) => {
                                            if (!tempFront && file) return
                                            setTempBack(file)
                                        }}
                                        message="Back File"
                                        accept="image/*,application/pdf,.doc,.docx"
                                        disabled={!tempFront}
                                        className={cn(
                                            "min-h-[160px] border-2 border-dashed border-gray-200 bg-gray-50/50 hover:bg-gray-100/50 hover:border-brand-byzantine/30 transition-all",
                                            !tempFront && "cursor-not-allowed pointer-events-none"
                                        )}
                                        emptyIcon={<Plus size={32} className="text-gray-300" />}
                                    />
                                </div>
                            </div>

                            <DialogFooter className="gap-2 sm:gap-2">
                                <Button type="button" variant="outline" onClick={() => setLocalUploadModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleLocalUploadSave}
                                    disabled={!tempFront}
                                    className="bg-brand-byzantine hover:bg-brand-byzantine/90"
                                >
                                    Save Files
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )
            )}

            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <FileText className="size-5 text-blue-600" />
                    <Typography as="h3" font="title" className="text-brand-secondary">
                        Supporting Documents
                    </Typography>
                </div>

                {isDocumentsLoading ? (
                    <PageLoader className="py-14 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200" />
                ) : requiredDocTypes.length > 0 || optionalDocTypes.length > 0 ? (
                    <div className="space-y-6">
                        {requiredDocTypes.length > 0 && (
                            <div className="space-y-4">
                                <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3 space-y-2">
                                    <Typography as="p" font="small" className="font-semibold text-brand-secondary">
                                        {requiredDocTypes.length} required document{requiredDocTypes.length !== 1 ? "s" : ""}
                                    </Typography>
                                    <ul className="space-y-1">
                                        {requiredDocTypes.map((rt) => (
                                            <li key={rt.id} className="flex items-start gap-2">
                                                <Typography as="span" font="small" className="text-brand-byzantine mt-0.5 shrink-0">•</Typography>
                                                <Typography as="span" font="small" className="text-gray-700 break-words">
                                                    {rt.name}
                                                </Typography>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                {renderDocumentCards(requiredDocTypes, true)}
                            </div>
                        )}

                        {optionalDocTypes.length > 0 && (
                            <div className="space-y-4">
                                <div className="rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 space-y-2">
                                    <Typography as="p" font="small" className="font-semibold text-gray-700">
                                        {optionalDocTypes.length} optional document{optionalDocTypes.length !== 1 ? "s" : ""}
                                    </Typography>
                                    <ul className="space-y-1">
                                        {optionalDocTypes.map((rt) => (
                                            <li key={rt.id} className="flex items-start gap-2">
                                                <Typography as="span" font="small" className="text-gray-400 mt-0.5 shrink-0">•</Typography>
                                                <Typography as="span" font="small" className="text-gray-600 break-words">
                                                    {rt.name}
                                                </Typography>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                {renderDocumentCards(optionalDocTypes, false)}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-12 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                        <FileText className="size-6 text-gray-400 mx-auto mb-3" />
                        <Typography as="p" className="text-sm font-bold text-gray-900">
                            No supporting documents required
                        </Typography>
                        <Typography as="p" className="text-xs text-gray-500 mt-1">
                            This program does not require additional supporting documents.
                        </Typography>
                    </div>
                )}
            </div>
        </>
        </TooltipProvider>
    )
}

export function Step4Application({ onBack }: { onBack: () => void }) {
    const router = useRouter()
    const { me } = useAuth()
    const { data: meData, isLoading, isFetching } = me
    const { data: degrees = [], isLoading: loadingDegrees } = useDegrees()
    const { data: levels = [] } = useLevels()

    const [selectedCourseId, setSelectedCourseId] = useState("")
    const [applicationDocError, setApplicationDocError] = useState<string | null>(null)
    const [pendingFiles, setPendingFiles] = useState<Record<string, { front: File | null; back: File | null }>>({})
    const [isUploading, setIsUploading] = useState<Record<string, boolean>>({})

    const studentProfileId = meData?.id ?? ""

    const qualificationId = meData?.academic?.[0]?.qualification ?? ""
    const qualificationLevelName = qualificationId
        ? degrees.find((d) => d.id === qualificationId)?.level?.name
        : null
    const qualificationDegreeName = qualificationId
        ? degrees.find((d) => d.id === qualificationId)?.name
        : null

    const { data: programsResponse } = useQuery({
        queryKey: ["programs"],
        queryFn: async () => {
            const res = await fetch("/api/program?limit=100")
            if (!res.ok) throw new Error("Failed to fetch courses")
            return res.json()
        },
    })

    const courses: CourseProgram[] = Array.isArray(programsResponse?.data) ? programsResponse.data : []

    const eligibleCourses = useMemo(
        () =>
            qualificationId
                ? filterCoursesByQualificationLevel(
                      courses,
                      qualificationLevelName,
                      qualificationDegreeName
                  )
                : [],
        [courses, qualificationId, qualificationLevelName, qualificationDegreeName]
    )

    const { data: allDocumentTypes = [] } = useQuery({
        queryKey: ["document-types"],
        queryFn: async () => {
            const res = await fetch("/api/document-type")
            if (!res.ok) throw new Error("Failed to fetch document types")
            const json = await res.json()
            return (json.data ?? []) as { id: string; name: string }[]
        },
        enabled: !!selectedCourseId,
    })

    const studentCountry = meData?.profile?.country ?? ""

    const { required: applicationRequiredDocTypes, optional: applicationOptionalDocTypes } = useMemo(() => {
        if (!selectedCourseId) {
            return { required: [], optional: [] }
        }

        const course = courses.find((c) => c.id === selectedCourseId)
        const fromCourse = resolveCourseDocumentTypes({
            requirements: course?.degree?.requirements ?? [],
            fallbackDocumentTypes: allDocumentTypes,
        })

        return withApsRequiredDocument(
            fromCourse,
            studentCountry,
            resolveApsDocumentType(allDocumentTypes)
        )
    }, [selectedCourseId, courses, allDocumentTypes, studentCountry])

    const { data: documents = [], isLoading: isDocumentsLoading, refetch: refetchDocuments } = useQuery({
        queryKey: ["onboarding-documents", studentProfileId],
        queryFn: async () => {
            if (!studentProfileId) return [] as Document[]
            const res = await fetch(`/api/document/student/${studentProfileId}`)
            if (!res.ok) throw new Error("Failed to fetch documents")
            const json = await res.json()
            return (Array.isArray(json?.data) ? json.data : []) as Document[]
        },
        enabled: !!studentProfileId,
    })

    const mutation = useMutation({
        mutationFn: async () => {
            const studentId = studentProfileId
            if (!studentId) throw new Error("Student not found")

            let currentDocuments = documents

            if (selectedCourseId) {
                const missingDocs = applicationRequiredDocTypes.filter(
                    (docType) => !hasUploadedDocument(docType.id, pendingFiles, currentDocuments)
                )
                if (missingDocs.length > 0) {
                    throw new Error(
                        `Please upload required documents: ${missingDocs.map((doc) => doc.name).join(", ")}`
                    )
                }
            }

            const uploadedDocIds: string[] = []

            for (const [docTypeId, files] of Object.entries(pendingFiles)) {
                if (files.front) {
                    setIsUploading((prev) => ({ ...prev, [docTypeId]: true }))

                    const formData = new FormData()
                    formData.set("student_id", studentId)
                    formData.set("document_type_id", docTypeId)
                    formData.append("files", files.front)
                    if (files.back) formData.append("files", files.back)

                    const res = await fetch("/api/document", { method: "POST", body: formData })
                    const data = await res.json()
                    if (!res.ok) throw new Error(data.error ?? "Failed to upload document")
                    uploadedDocIds.push(data.data.id)

                    setIsUploading((prev) => ({ ...prev, [docTypeId]: false }))
                    setPendingFiles((prev) => {
                        const next = { ...prev }
                        delete next[docTypeId]
                        return next
                    })
                }
            }

            const refreshResult = await refetchDocuments()
            currentDocuments = (refreshResult.data ?? currentDocuments) as Document[]

            if (selectedCourseId) {
                const stillMissing = applicationRequiredDocTypes.filter(
                    (docType) => !hasUploadedDocument(docType.id, {}, currentDocuments)
                )
                if (stillMissing.length > 0) {
                    throw new Error(
                        `Please upload required documents: ${stillMissing.map((doc) => doc.name).join(", ")}`
                    )
                }

                const course = courses.find((c) => c.id === selectedCourseId)
                const levelId = course?.degree?.level_id
                const universityId = levels.find((level) => level.id === levelId)?.university_id ?? ""

                if (!universityId) {
                    throw new Error("Could not resolve university for the selected course")
                }

                const allDocIds = [
                    ...new Set([
                        ...currentDocuments.map((d) => d.id),
                        ...uploadedDocIds,
                    ]),
                ]

                if (allDocIds.length === 0) {
                    throw new Error("Please attach at least one document")
                }

                const res = await fetch("/api/application", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        profile_id: studentId,
                        course_id: selectedCourseId,
                        university_id: universityId,
                        document_ids: allDocIds,
                        intake_date: course?.degree?.intake_date ?? "summer",
                        declarations: [true, true, true],
                    }),
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error ?? "Failed to create application")
            }
        },
        onSuccess: () => {
            router.push("/dashboard")
        },
        onError: (error) => {
            setApplicationDocError(error instanceof Error ? error.message : "Something went wrong")
        },
    })

    const handleFinish = useCallback(() => {
        setApplicationDocError(null)

        const hasPendingUploads = Object.values(pendingFiles).some((files) => files.front)
        if (!selectedCourseId && !hasPendingUploads) {
            router.push("/dashboard")
            return
        }

        if (selectedCourseId && applicationRequiredDocTypes.length > 0) {
            const missingDocs = applicationRequiredDocTypes.filter(
                (docType) => !hasUploadedDocument(docType.id, pendingFiles, documents)
            )
            if (missingDocs.length > 0) {
                setApplicationDocError(
                    `Please upload required documents: ${missingDocs.map((doc) => doc.name).join(", ")}`
                )
                return
            }
        }

        mutation.mutate()
    }, [applicationRequiredDocTypes, documents, mutation, pendingFiles, router, selectedCourseId])

    if (isLoading || loadingDegrees || (isFetching && !qualificationId)) {
        return <PageLoader />
    }

    return (
        <div className="space-y-6">
            {!qualificationId ? (
                <div className="rounded-sm border border-dashed border-gray-200 bg-gray-50/50 px-4 py-6 text-center">
                    <Typography as="p" className="text-sm font-medium text-gray-500">
                        Select your highest degree in Academic Background to view available courses.
                    </Typography>
                </div>
            ) : (
                <div className="space-y-2">
                    <FieldLabel>Courses</FieldLabel>
                    <Select
                        value={selectedCourseId || undefined}
                        onValueChange={(val) => {
                            setSelectedCourseId(val)
                            setPendingFiles({})
                            setApplicationDocError(null)
                        }}
                    >
                        <SelectTrigger className="h-12 w-full">
                            <SelectValue
                                placeholder={
                                    eligibleCourses.length === 0
                                        ? "No courses available for this qualification level."
                                        : "Select a course"
                                }
                            />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                            {eligibleCourses.map((course) => (
                                <SelectItem key={course.id} value={course.id}>
                                    {course.name}
                                    {course.degree?.level?.name || course.deadline_date
                                        ? ` — ${[course.degree?.level?.name, formatProgramDate(course.deadline_date)]
                                              .filter(Boolean)
                                              .join(" • ")}`
                                        : ""}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {selectedCourseId && (
                <>
                    <Typography as="p" className="text-sm text-muted-foreground">
                        This application is optional. Documents marked as required must be uploaded before submitting.
                    </Typography>

                    <SupportingDocumentsSection
                        documents={documents}
                        requiredDocTypes={applicationRequiredDocTypes}
                        optionalDocTypes={applicationOptionalDocTypes}
                        studentId={studentProfileId}
                        refetchDocuments={refetchDocuments}
                        pendingFiles={pendingFiles}
                        setPendingFiles={setPendingFiles}
                        isUploading={isUploading}
                        isDocumentsLoading={isDocumentsLoading}
                    />
                </>
            )}

            {applicationDocError && (
                <Typography as="p" className="text-destructive text-sm">
                    {applicationDocError}
                </Typography>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <Button type="button" variant="outline" className="w-full sm:w-auto sm:flex-1" onClick={onBack}>
                    Back
                </Button>
                <Button type="button" variant="outline" className="w-full sm:w-auto sm:flex-1" onClick={() => router.push("/dashboard")}>
                    Skip
                </Button>
                <Button
                    type="button"
                    onClick={handleFinish}
                    disabled={mutation.isPending}
                    className="w-full sm:w-auto sm:flex-1 bg-brand-byzantine hover:bg-brand-byzantine/90"
                >
                    {mutation.isPending ? (
                        <>
                            <Spinner size="sm" className="mr-2" />
                            Processing...
                        </>
                    ) : selectedCourseId ? (
                        "Submit & Apply"
                    ) : (
                        "Finish"
                    )}
                </Button>
            </div>

            {mutation.isError && !applicationDocError && (
                <Typography as="p" className="text-destructive text-sm">
                    {mutation.error instanceof Error ? mutation.error.message : "Something went wrong"}
                </Typography>
            )}
        </div>
    )
}
