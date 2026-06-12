"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Typography } from "@/components/shared/Typography"
import { F } from "./_shared"
import { useAuth } from "@/hooks/useAuth"
import { PageLoader } from "@/components/shared/page-loader"
import { useQuery, useMutation } from "@tanstack/react-query"
import { FileText, Loader2, CheckSquare, Square } from "lucide-react"
import { ImageUploadCard } from "@/components/shared/image-upload-card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { CourseProgram } from "@/types/schemas/program"

type Document = {
    id: string;
    name: string;
    created_at: string;
    document_type?: {
        id: string;
        name: string;
    };
    document_type_id?: string;
    document_files?: {
        file_url: string;
    }[];
};


// Re-define SupportingDocumentsSection here since we can't import from StudentForm easily
function SupportingDocumentsSection({
    documents,
    requiredDocTypes,
    selectedCourseId,
    selectedStudentId,
    refetchDocuments,
    selectedDocumentIds,
    onDocumentSelect,
    isDocumentsLoading,
    pendingFiles,
    setPendingFiles,
    isUploading,
}: {
    documents: Document[];
    requiredDocTypes: { id: string; name: string }[];
    selectedCourseId: string;
    selectedStudentId: string;
    refetchDocuments: () => Promise<unknown>;
    selectedDocumentIds: string[];
    onDocumentSelect: (docIds: string[]) => void;
    isDocumentsLoading?: boolean;
    pendingFiles: Record<string, { front: File | null; back: File | null }>;
    setPendingFiles: React.Dispatch<React.SetStateAction<Record<string, { front: File | null; back: File | null }>>>;
    isUploading: Record<string, boolean>;
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
                [activeDocumentType.id]: { front: tempFront, back: tempBack }
            }))
        }
        setLocalUploadModalOpen(false)
        setTempFront(null)
        setTempBack(null)
    }, [activeDocumentType, tempFront, tempBack, setPendingFiles])

    if (!selectedCourseId) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-8">
                <div className="flex items-center gap-2 mb-4">
                    <FileText className="size-5 text-blue-600" />
                    <Typography as="h3" font="title" className="text-brand-secondary">Supporting Documents</Typography>
                </div>
                <div className="py-10 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    <Typography as="p" className="text-sm font-medium text-gray-500">
                        Select a course above to view required supporting documents.
                    </Typography>
                </div>
            </div>
        )
    }

    return (
        <>
            {/* Modal for pending files (before student created) */}
            {selectedStudentId && activeDocumentType && (
                <Dialog open={localUploadModalOpen} onOpenChange={setLocalUploadModalOpen}>
                    <DialogContent className="sm:max-w-xl">
                        <DialogHeader>
                            <DialogTitle>
                                Upload {activeDocumentType.name}
                            </DialogTitle>
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
                                    className={cn(
                                        "min-h-[160px] border-2 border-transparent hover:border-brand-byzantine bg-gray-50/50 hover:bg-gray-100/50 transition-all"
                                    )}
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
                                />
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setLocalUploadModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleLocalUploadSave}
                                disabled={!tempFront}
                                className="bg-brand-byzantine hover:bg-brand-byzantine/90"
                            >
                                Save
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-8">
                <div className="flex items-center gap-2 mb-4">
                    <FileText className="size-5 text-blue-600" />
                    <Typography as="h3" font="title" className="text-brand-secondary">Supporting Documents</Typography>
                </div>

                {isDocumentsLoading ? (
                    <div className="py-10 flex items-center justify-center">
                        <Loader2 className="size-6 text-gray-400 animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {requiredDocTypes.map((rt) => {
                            const doc = documents.find(d => (d.document_type?.id ?? d.document_type_id) === rt.id);
                            const isChecked = doc ? selectedDocumentIds.includes(doc.id) : false;
                            const hasPending = pendingFiles[rt.id]?.front;

                            if (isUploading[rt.id]) {
                                return (
                                    <div
                                        key={rt.id}
                                        className="bg-[#f8f9fc] rounded-xl p-3 space-y-3 relative border-2 border-purple-400 bg-purple-50/30 shadow-md cursor-not-allowed"
                                    >
                                        <div className="absolute top-3 left-3 z-10">
                                            <Loader2 className="size-4 text-purple-500 animate-spin" />
                                        </div>
                                        <div className="aspect-square bg-white rounded-lg flex items-center justify-center overflow-hidden border border-gray-100 shadow-inner">
                                            <Loader2 className="size-10 text-purple-500 animate-spin" />
                                        </div>
                                        <div>
                                            <Typography as="p" className="text-[11px] font-bold text-gray-900 truncate">{rt.name}</Typography>
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
                                        onClick={() => {
                                            const next = selectedDocumentIds.includes(doc.id)
                                                ? selectedDocumentIds.filter((id: string) => id !== doc.id)
                                                : [...selectedDocumentIds, doc.id];
                                            onDocumentSelect(next);
                                        }}
                                        className={cn(
                                            "bg-[#f8f9fc] rounded-xl p-3 space-y-3 relative border transition-all cursor-pointer group",
                                            isChecked ? "border-green-500 bg-green-50/30 shadow-md" : "border-gray-100 hover:border-gray-300"
                                        )}
                                    >
                                        <div className="absolute top-3 left-3 z-10">
                                            {isChecked
                                                ? <CheckSquare className="size-4 text-green-500 fill-green-50" />
                                                : <Square className="size-4 text-brand-secondary/20 group-hover:text-brand-secondary/40" />}
                                        </div>
                                        <div className="aspect-square bg-white rounded-lg flex items-center justify-center overflow-hidden border border-gray-100 shadow-inner">
                                            <FileText className={cn("size-10", isChecked ? "text-green-500" : "text-gray-300")} />
                                        </div>
                                        <div>
                                            <Typography as="p" className="text-[11px] font-bold text-gray-900 truncate">{rt.name}</Typography>
                                            <Typography as="p" className="text-[8px] font-bold tracking-widest text-gray-500 uppercase mt-1">
                                                {new Date(doc.created_at).toLocaleDateString()}
                                            </Typography>
                                        </div>
                                    </div>
                                );
                            }

                            if (hasPending) {
                                return (
                                    <div
                                        key={rt.id}
                                        onClick={() => openLocalUploadModal(rt)}
                                        className="bg-[#f8f9fc] rounded-xl p-3 space-y-3 border-2 border-dashed border-blue-400 cursor-pointer hover:border-blue-500"
                                    >
                                        <div className="aspect-square bg-white rounded-lg flex items-center justify-center overflow-hidden border border-gray-100 shadow-inner">
                                            <FileText className="size-10 text-blue-500" />
                                        </div>
                                        <div>
                                            <Typography as="p" className="text-[11px] font-bold text-gray-900 truncate">{rt.name}</Typography>
                                            <Typography as="p" className="text-[8px] font-bold tracking-widest text-blue-600 uppercase mt-1">
                                                Ready to upload
                                            </Typography>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={rt.id}
                                    onClick={() => openLocalUploadModal(rt)}
                                    className="bg-[#fff5f5] rounded-xl p-3 space-y-3 border-2 border-dashed border-red-300 cursor-pointer hover:border-red-400"
                                >
                                    <div className="aspect-square bg-white rounded-lg flex items-center justify-center overflow-hidden border border-gray-100 shadow-inner">
                                        <FileText className="size-10 text-red-500" />
                                    </div>
                                    <div>
                                        <Typography as="p" className="text-[11px] font-bold text-gray-900 truncate">{rt.name}</Typography>
                                        <Typography as="p" className="text-[8px] font-bold tracking-widest text-red-600 uppercase mt-1">
                                            Click to upload
                                        </Typography>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    )
}

export function Step4Course({ onBack }: { onBack: () => void }) {
    const router = useRouter()
    const { me } = useAuth()
    const { data: meData, isLoading } = me

    const [selectedCourseId, setSelectedCourseId] = useState<string>("")
    const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])
    const [documents, setDocuments] = useState<Document[]>([])
    const [isDocumentsLoading, setIsDocumentsLoading] = useState(false)
    const [pendingFiles, setPendingFiles] = useState<Record<string, { front: File | null; back: File | null }>>({})
    const [isUploading, setIsUploading] = useState<Record<string, boolean>>({})

    // Fetch courses
    const { data: programsResponse } = useQuery({
        queryKey: ["programs"],
        queryFn: async () => {
            const res = await fetch("/api/program?limit=50")
            if (!res.ok) throw new Error("Failed to fetch courses")
            return res.json()
        },
    })
    const courses: CourseProgram[] = Array.isArray(programsResponse?.data) ? programsResponse.data : []



    // Get filtered courses (higher than highest degree)
    // Note: meData.academic items only carry a plain qualification UUID string;
    // nested level info is not available here, so we return all courses.
    const filteredCourses = useCallback(() => {
        return courses
    }, [courses])

    const { data: programDetailResponse } = useQuery({
        queryKey: ["course-detail", selectedCourseId],
        queryFn: async () => {
            if (!selectedCourseId) return null
            const res = await fetch(`/api/program/${selectedCourseId}`)
            if (!res.ok) throw new Error("Failed to fetch course details")
            return res.json()
        },
        enabled: !!selectedCourseId,
    })

    const requiredDocTypes: { id: string; name: string }[] = useMemo(() => {
        const fromCourse = (
            programDetailResponse?.data?.degree?.requirements ?? []
        )
            .map((r: { document_type?: { id: string; name: string } }) => r.document_type)
            .filter((t: { id: string; name: string } | undefined): t is { id: string; name: string } => Boolean(t?.id))

        if (fromCourse.length > 0) return fromCourse

        return []
    }, [programDetailResponse])

    // Fetch existing documents for student
    const refetchDocuments = useCallback(async () => {
        if (!meData?.id) return
        setIsDocumentsLoading(true)
        try {
            const res = await fetch(`/api/documents?student_id=${meData.id}`)
            if (!res.ok) throw new Error("Failed to fetch documents")
            const data = await res.json()
            setDocuments(data.data)
        } catch (err) {
            console.error(err)
        } finally {
            setIsDocumentsLoading(false)
        }
    }, [meData?.id])

    useEffect(() => {
        refetchDocuments()
    }, [refetchDocuments])

    // Mutation to create application and upload docs
    const mutation = useMutation({
        mutationFn: async () => {
            const uploadedDocIds: string[] = []
            const studentId = meData?.id

            if (!studentId) throw new Error("Student not found")

            // Upload pending files
            for (const [docTypeId, files] of Object.entries(pendingFiles)) {
                if (files.front) {
                    setIsUploading(prev => ({ ...prev, [docTypeId]: true }))

                    const formData = new FormData()
                    formData.set("student_id", studentId)
                    formData.set("document_type_id", docTypeId)
                    formData.append("files", files.front)
                    if (files.back) {
                        formData.append("files", files.back)
                    }

                    const res = await fetch("/api/document", { method: "POST", body: formData })
                    const data = await res.json()
                    if (!res.ok) throw new Error(data.error ?? "Failed to upload document")
                    uploadedDocIds.push(data.data.id)

                    setIsUploading(prev => ({ ...prev, [docTypeId]: false }))
                    // Remove from pending files
                    setPendingFiles(prev => {
                        const next = { ...prev }
                        delete next[docTypeId]
                        return next
                    })
                }
            }

            await refetchDocuments()

            // If course selected, create application
            if (selectedCourseId) {
                // Get all selected doc ids
                const allSelectedDocIds = [...selectedDocumentIds, ...uploadedDocIds]
                // Find the selected course
                const course = courses.find((c: CourseProgram) => c.id === selectedCourseId)
                const applicationData = new FormData()
                applicationData.set("course_id", selectedCourseId)
                applicationData.set("student_id", studentId)
                applicationData.set("status", "pending")
                applicationData.set("intake_date", new Date().toISOString().split('T')[0])
                applicationData.set("declarations", JSON.stringify([true, true, true]))
                allSelectedDocIds.forEach(docId => {
                    applicationData.append("document_ids", docId)
                })
                const res = await fetch("/api/applications", {
                    method: "POST",
                    body: applicationData
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error ?? "Failed to create application")
            }
        },
        onSuccess: () => {
            router.push("/dashboard")
        }
    })

    if (isLoading) return <PageLoader label="Loading..." />

    return (
        <div className="space-y-6">
            <div>
                <F label="Select Course (Optional)">
                    <Select
                        value={selectedCourseId}
                        onValueChange={(val) => {
                            setSelectedCourseId(val)
                            setSelectedDocumentIds([])
                            setPendingFiles({})
                        }}
                    >
                        <SelectTrigger className="h-14">
                            <SelectValue placeholder="Select a course" />
                        </SelectTrigger>
                        <SelectContent>
                            {filteredCourses().map((course: CourseProgram) => (
                                <SelectItem key={course.id} value={course.id}>
                                    {course.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </F>
            </div>

            {selectedCourseId && (
                <SupportingDocumentsSection
                    documents={documents}
                    requiredDocTypes={requiredDocTypes}
                    selectedCourseId={selectedCourseId}
                    selectedStudentId={meData?.id || ""}
                    refetchDocuments={refetchDocuments}
                    selectedDocumentIds={selectedDocumentIds}
                    onDocumentSelect={setSelectedDocumentIds}
                    isDocumentsLoading={isDocumentsLoading}
                    pendingFiles={pendingFiles}
                    setPendingFiles={setPendingFiles}
                    isUploading={isUploading}
                />
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
                    onClick={() => mutation.mutate()}
                    disabled={mutation.isPending}
                    className="w-full sm:w-auto sm:flex-1 bg-brand-byzantine hover:bg-brand-byzantine/90"
                >
                    {mutation.isPending ? (
                        <>
                            <Loader2 className="size-4 animate-spin mr-2" />
                            Processing...
                        </>
                    ) : (
                        selectedCourseId ? "Submit & Apply" : "Finish"
                    )}
                </Button>
            </div>

            {mutation.isError && (
                <Typography className="text-destructive mt-4 text-sm">
                    {mutation.error instanceof Error ? mutation.error.message : "Something went wrong"}
                </Typography>
            )}
        </div>
    )
}
