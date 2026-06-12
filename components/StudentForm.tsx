"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useStore } from "@tanstack/react-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { StudentFormSchema, type StudentInput } from "@/types/schemas/student"
import { Typography } from "@/components/shared/Typography"
import { ErrorView } from "@/components/shared/error-view"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PhoneInputComponent } from "@/components/ui/phone-input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import ImageUploadCard from "./shared/image-upload-card"
import { DatePicker } from "@/components/shared/date-picker"
import { CountrySelect } from "@/components/shared/country-select"
import { Building, ChevronDown, School, FileUp, FileText, CheckSquare, Square, Plus, Loader2 } from "lucide-react"
import { resolveGradeType, type GradeType } from "@/types/schemas/academic"
import { useDegrees, formatDegreeLabel } from "@/hooks/useDegrees"
import { toast } from "sonner"
import { FilePreview } from "./shared/FilePreview"
import { cn } from "@/lib/utils"
import { useLevels } from "@/hooks/useLevels"
import type { CourseProgram } from "@/types/schemas/program"
import { formatIntakeDate, formatProgramDate } from "@/lib/utils/program"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { UserRole } from "@/types"

function getFieldState(field: {
    state: { meta: { isTouched: boolean; isValid: boolean; errors?: unknown[] } }
    form: { state: { isSubmitted: boolean } }
}) {
    const isInvalid =
        (field.state.meta.isTouched || field.form.state.isSubmitted) &&
        !field.state.meta.isValid
    const raw = field.state.meta.errors?.[0]
    const error =
        raw == null
            ? undefined
            : typeof raw === "string"
                ? raw
                : (raw as { message?: string }).message
    return { isInvalid, error }
}

function F({ field, label, children }: { field: any; label: string; children: React.ReactNode }) {
    const { isInvalid, error } = getFieldState(field)
    return (
        <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
            {children}
            {isInvalid && error && <FieldError errors={[{ message: error }]} />}
        </Field>
    )
}

type StudentData = {
    title?: string | null
    name?: string | null
    email?: string | null
    phone?: string | null
    date_of_birth?: string | null
    gender?: string | null
    avatar_url?: string | null
    student?: {
        country?: string | null
        state?: string | null
        city?: string | null
        nationality?: string | null
        guardian_email?: string | null
        guardian_phone?: string | null
        passport_file_url?: string | null
    } | null
    education?: Array<{
        id?: string | null
        qualification?: string | null
        institution_name?: string | null
        grade_type?: string | null
        gpa?: number | string | null
        obtained_marks?: number | string | null
        total_marks?: number | string | null
    }> | {
        id?: string | null
        qualification?: string | null
        institution_name?: string | null
        grade_type?: string | null
        gpa?: number | string | null
        obtained_marks?: number | string | null
        total_marks?: number | string | null
    } | null
}

type Props = {
    mode: "create" | "edit"
    studentId?: string
    defaultData?: StudentData
}

type Document = {
    id: string;
    name: string;
    document_type_id: string;
    document_type?: { id: string; name: string };
    created_at: string;
    document_files?: { file_url: string }[];
};

function SupportingDocumentUploadModal({
    open,
    onOpenChange,
    studentId,
    documentType,
    onUploaded,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentId: string;
    documentType: { id: string; name: string } | null;
    onUploaded: (documentId: string) => void;
}) {
    const [frontFile, setFrontFile] = useState<File | null>(null);
    const [backFile, setBackFile] = useState<File | null>(null);
    const queryClient = useQueryClient();

    const uploadMutation = useMutation({
        mutationFn: async () => {
            if (!studentId || !documentType?.id || !frontFile) {
                throw new Error("Please upload the front side file");
            }

            const formData = new FormData();
            formData.set("student_id", studentId);
            formData.set("document_type_id", documentType.id);
            formData.append("files", frontFile);
            if (backFile) {
                formData.append("files", backFile);
            }

            const res = await fetch("/api/document", { method: "POST", body: formData });
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error ?? "Failed to upload document");
            }

            return json.data as { id: string };
        },
        onSuccess: (data) => {
            toast.success("Document uploaded successfully");
            queryClient.invalidateQueries({ queryKey: ["student-documents"], exact: false });
            queryClient.invalidateQueries({ queryKey: ["documents"] });
            onUploaded(data.id);
            setFrontFile(null);
            setBackFile(null);
            onOpenChange(false);
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const handleOpenChange = useCallback(
        (nextOpen: boolean) => {
            if (uploadMutation.isPending) return;
            if (!nextOpen) {
                setFrontFile(null);
                setBackFile(null);
            }
            onOpenChange(nextOpen);
        },
        [onOpenChange, uploadMutation.isPending]
    );

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        Upload {documentType?.name ?? "Document"}
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
                            value={frontFile}
                            onChange={setFrontFile}
                            message="Front File"
                            accept="image/*,application/pdf,.doc,.docx"
                            className={cn(
                                "min-h-[160px] border-2 border-transparent hover:border-brand-byzantine bg-gray-50/50 hover:bg-gray-100/50 transition-all"
                            )}
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
                                if (!frontFile && file) return;
                                setBackFile(file);
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
                                <Loader2 className="size-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            "Upload Document"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

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
    const [localUploadModalOpen, setLocalUploadModalOpen] = useState(false);
    const [activeDocumentType, setActiveDocumentType] = useState<{ id: string; name: string } | null>(null);
    const [tempFront, setTempFront] = useState<File | null>(null);
    const [tempBack, setTempBack] = useState<File | null>(null);

    const openLocalUploadModal = useCallback((documentType: { id: string; name: string }) => {
        setActiveDocumentType(documentType);
        setTempFront(pendingFiles[documentType.id]?.front || null);
        setTempBack(pendingFiles[documentType.id]?.back || null);
        setLocalUploadModalOpen(true);
    }, [pendingFiles]);

    const handleLocalUploadSave = useCallback(() => {
        if (activeDocumentType) {
            setPendingFiles((prev) => ({
                ...prev,
                [activeDocumentType.id]: { front: tempFront, back: tempBack }
            }));
        }
        setLocalUploadModalOpen(false);
        setTempFront(null);
        setTempBack(null);
    }, [activeDocumentType, tempFront, tempBack, setPendingFiles]);

    const handleDocumentUploaded = useCallback(
        async (documentId: string) => {
            await refetchDocuments();
            onDocumentSelect([...selectedDocumentIds, documentId]);
        },
        [selectedDocumentIds, refetchDocuments, onDocumentSelect]
    );

    if (!selectedCourseId) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
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
        );
    }

    return (
        <>
            {/* Modal for pending files (before student created) */}
            {!selectedStudentId && activeDocumentType && (
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
                                        if (!tempFront && file) return;
                                        setTempBack(file);
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
                                Save Files
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Modal for uploading to server (after student created) */}
            {selectedStudentId && (
                <SupportingDocumentUploadModal
                    open={localUploadModalOpen}
                    onOpenChange={setLocalUploadModalOpen}
                    studentId={selectedStudentId}
                    documentType={activeDocumentType}
                    onUploaded={handleDocumentUploaded}
                />
            )}

            <div className="bg-white rounded-2xl p-6 space-y-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="size-5 text-blue-600" />
                        <Typography as="h3" font="title" className="text-brand-secondary">Supporting Documents</Typography>
                    </div>
                </div>

                {isDocumentsLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : requiredDocTypes.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {requiredDocTypes.map((rt) => {
                            const doc = documents.find(d => (d.document_type?.id ?? d.document_type_id) === rt.id);
                            const isChecked = doc ? selectedDocumentIds.includes(doc.id) : false;
                            const hasPending = pendingFiles[rt.id]?.front;
                            if (isUploading[rt.id]) {
                                return (
                                    <div
                                        key={rt.id}
                                        className="bg-[#f8f9fc] rounded-xl p-3 space-y-3 relative border-2 border-purple-400 bg-purple-50/30 shadow-md cursor-not-allowed group"
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
                                );
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
                                            {doc.document_files?.[0]?.file_url ? (
                                                <FilePreview
                                                    url={doc.document_files[0].file_url}
                                                    name={rt.name}
                                                    showActions={false}
                                                    className="border-none shadow-none size-full"
                                                />
                                            ) : (
                                                <FileText className={cn("size-10", isChecked ? "text-green-500" : "text-gray-300")} />
                                            )}
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
                            if (hasPending && !selectedStudentId) {
                                return (
                                    <div
                                        key={rt.id}
                                        className="bg-[#f8f9fc] rounded-xl p-3 space-y-3 relative border-2 border-yellow-400 bg-yellow-50/30 shadow-md cursor-pointer group"
                                        onClick={() => openLocalUploadModal(rt)}
                                    >
                                        <div className="absolute top-3 left-3 z-10">
                                            <Square className="size-4 text-brand-secondary/20 group-hover:text-brand-secondary/40" />
                                        </div>
                                        <div className="aspect-square bg-white rounded-lg flex items-center justify-center overflow-hidden border border-gray-100 shadow-inner">
                                            <FileText className="size-10 text-yellow-500" />
                                        </div>
                                        <div>
                                            <Typography as="p" className="text-[11px] font-bold text-gray-900 truncate">{rt.name}</Typography>
                                            <Typography as="p" className="text-[8px] font-bold tracking-widest text-yellow-600 uppercase mt-1">
                                                Pending
                                            </Typography>
                                        </div>
                                    </div>
                                );
                            }
                            return (
                                <button
                                    key={rt.id}
                                    type="button"
                                    onClick={() => {
                                        if (selectedStudentId) {
                                            openLocalUploadModal(rt);
                                        } else {
                                            openLocalUploadModal(rt);
                                        }
                                    }}
                                    className="bg-red-50/50 rounded-xl p-3 space-y-3 relative border-2 border-dashed border-red-200 flex flex-col items-center justify-center gap-2 min-h-[140px] hover:bg-red-50 hover:border-red-300 transition-all group w-full"
                                >
                                    <div className="size-10 rounded-full bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                                        <FileText className="size-5 text-red-400" />
                                    </div>
                                    <div className="text-center">
                                        <Typography as="p" className="text-[11px] font-bold text-red-600 truncate">{rt.name}</Typography>
                                        <Typography as="p" className="text-[9px] text-red-400 mt-0.5">Click to upload</Typography>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : documents.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {documents.map((doc) => {
                            const isChecked = selectedDocumentIds.includes(doc.id);
                            const label = doc.document_type?.name ?? "Document";
                            return (
                                <div
                                    key={doc.id}
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
                                        {doc.document_files?.[0]?.file_url ? (
                                            <FilePreview
                                                url={doc.document_files[0].file_url}
                                                name={label}
                                                showActions={false}
                                                className="border-none shadow-none size-full"
                                            />
                                        ) : (
                                            <FileText className={cn("size-10", isChecked ? "text-green-500" : "text-gray-300")} />
                                        )}
                                    </div>
                                    <div>
                                        <Typography as="p" className="text-[11px] font-bold text-gray-900 truncate">{label}</Typography>
                                        <Typography as="p" className="text-[8px] font-bold tracking-widest text-gray-500 uppercase mt-1">
                                            {new Date(doc.created_at).toLocaleDateString()}
                                        </Typography>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="col-span-full py-12 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center gap-4">
                        <FileText className="size-6 text-gray-400" />
                        <Typography as="p" className="text-sm font-bold text-gray-900">No documents uploaded yet</Typography>
                        <Typography as="p" className="text-xs text-gray-500">Upload required documents using the cards above.</Typography>
                    </div>
                )}
            </div>
        </>
    );
}

export function StudentForm({ mode, studentId, defaultData }: Props) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const { data: degrees = [], isLoading: loadingDegrees } = useDegrees()

    const [selectedCourseId, setSelectedCourseId] = useState<string>("");
    const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
    const [createdStudentId, setCreatedStudentId] = useState<string | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isDocumentsLoading, setIsDocumentsLoading] = useState(false);
    const [pendingFiles, setPendingFiles] = useState<Record<string, { front: File | null; back: File | null }>>({});
    const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});

    const { data: user } = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const res = await fetch("/api/me");
            if (!res.ok) throw new Error("Failed to fetch profile");
            const json = await res.json();
            return json.data;
        },
    });

    const { data: programsResponse } = useQuery({
        queryKey: ["programs"],
        queryFn: async () => {
            const res = await fetch("/api/program?limit=50");
            if (!res.ok) throw new Error("Failed to fetch courses");
            return res.json();
        }
    });
    const courses: CourseProgram[] = Array.isArray(programsResponse?.data) ? programsResponse.data : [];
    const { data: levels = [] } = useLevels();

    const { data: programDetailResponse } = useQuery({
        queryKey: ["course-detail", selectedCourseId],
        queryFn: async () => {
            if (!selectedCourseId) return null;
            const res = await fetch(`/api/program/${selectedCourseId}`);
            if (!res.ok) throw new Error("Failed to fetch course details");
            return res.json();
        },
        enabled: !!selectedCourseId,
    });

    const requiredDocTypes: { id: string; name: string }[] = useMemo(() => {
        const fromCourse = (
            programDetailResponse?.data?.degree?.requirements ?? []
        )
            .map((r: { document_type?: { id: string; name: string } }) => r.document_type)
            .filter((t: { id: string; name: string } | undefined): t is { id: string; name: string } => Boolean(t?.id));

        if (fromCourse.length > 0) return fromCourse;

        return documents.reduce<{ id: string; name: string }[]>((acc, d) => {
            const typeId = d.document_type?.id ?? d.document_type_id;
            const typeName = d.document_type?.name ?? "Document";
            if (typeId && !acc.find(x => x.id === typeId)) {
                acc.push({ id: typeId, name: typeName });
            }
            return acc;
        }, []);
    }, [programDetailResponse, documents]);

    const refetchDocuments = useCallback(async () => {
        if (!createdStudentId) return;
        setIsDocumentsLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedCourseId) params.set("course_id", selectedCourseId);
            const res = await fetch(`/api/document/student/${createdStudentId}?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch documents");
            const json = await res.json();
            setDocuments(Array.isArray(json?.data) ? json.data : []);
        } finally {
            setIsDocumentsLoading(false);
        }
    }, [createdStudentId, selectedCourseId]);

    // Refetch documents when student is created
    useEffect(() => {
        if (createdStudentId) {
            refetchDocuments();
        }
    }, [createdStudentId, refetchDocuments]);

    const mutation = useMutation({
        mutationFn: async ({
            studentFormData,
            selectedCourseId,
            pendingFiles,
            requiredDocTypes,
            courses,
            levels
        }: {
            studentFormData: FormData,
            selectedCourseId: string,
            pendingFiles: Record<string, { front: File | null; back: File | null }>,
            requiredDocTypes: { id: string; name: string }[],
            courses: CourseProgram[],
            levels: any[]
        }) => {
            // Step 1: Create student
            const studentRes = await fetch("/api/student", { method: "POST", body: studentFormData });
            const studentJson = await studentRes.json();
            if (!studentRes.ok) throw new Error(studentJson?.error ?? "Failed to create student");
            const newStudentProfileId = studentJson.data.id;
            setCreatedStudentId(newStudentProfileId);

            const uploadedDocIds: string[] = [];

            // Step 2: Upload pending files
            for (const [docTypeId, files] of Object.entries(pendingFiles)) {
                if (files.front) {
                    // Mark this document type as uploading
                    setIsUploading(prev => ({ ...prev, [docTypeId]: true }));

                    const formData = new FormData();
                    formData.set("student_id", newStudentProfileId);
                    formData.set("document_type_id", docTypeId);
                    formData.append("files", files.front);
                    if (files.back) {
                        formData.append("files", files.back);
                    }

                    const res = await fetch("/api/document", { method: "POST", body: formData });
                    const json = await res.json();
                    if (!res.ok) {
                        throw new Error(json.error ?? "Failed to upload document");
                    }
                    uploadedDocIds.push(json.data.id);

                    // Mark this document type as not uploading anymore
                    setIsUploading(prev => ({ ...prev, [docTypeId]: false }));
                    // Remove from pendingFiles
                    setPendingFiles(prev => {
                        const next = { ...prev };
                        delete next[docTypeId];
                        return next;
                    });
                    // Refresh documents list
                    await refetchDocuments();
                }
            }

            // Step 3: If course selected, create application
            if (selectedCourseId) {
                let universityId = "";
                const course = courses.find(c => c.id === selectedCourseId);
                if (course) {
                    const levelId = course.degree?.level_id;
                    universityId = levels.find((level) => level.id === levelId)?.university_id ?? "";
                }

                // Use course's intake date or today's date, and set all declarations to true
                const today = new Date().toISOString().split('T')[0];
                const appRes = await fetch("/api/application", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        profile_id: newStudentProfileId,
                        course_id: selectedCourseId,
                        university_id: universityId,
                        document_ids: uploadedDocIds,
                        intake_date: course?.degree?.intake_date ?? today,
                        declarations: [true, true, true],
                    })
                });
                const appJson = await appRes.json();
                if (!appRes.ok) throw new Error(appJson?.error ?? "Failed to create application");
            }

            return studentJson;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
            queryClient.invalidateQueries({ queryKey: ["applications"] });
            toast.success("Student and application created successfully!");
            router.push("/dashboard/application");
            router.refresh();
        },
    })

    const apiError = mutation.error instanceof Error ? mutation.error.message : ""

    const eduList = Array.isArray(defaultData?.education)
        ? defaultData.education
        : defaultData?.education
            ? [defaultData.education]
            : null

    const form = useForm({
        defaultValues: {
            title: defaultData?.title ?? "",
            first_name: defaultData?.name?.split(' ')[0] ?? "",
            last_name: defaultData?.name?.split(' ').slice(1).join(' ') ?? "",
            email: defaultData?.email ?? "",
            phone: defaultData?.phone ?? "",
            dob: defaultData?.date_of_birth ?? "",
            gender: (defaultData?.gender?.toUpperCase() === "MALE" || defaultData?.gender?.toUpperCase() === "FEMALE"
                ? defaultData.gender.toUpperCase()
                : undefined) as "MALE" | "FEMALE" | undefined,
            country: defaultData?.student?.country ?? "",
            state: defaultData?.student?.state ?? "",
            city: defaultData?.student?.city ?? "",
            nationality: defaultData?.student?.nationality ?? "",
            guardian_email: defaultData?.student?.guardian_email ?? "",
            guardian_phone: defaultData?.student?.guardian_phone ?? "",
            avatar_url: undefined as File | undefined,
            passport_file_url: undefined as File | undefined,
            cv_file: undefined as File | undefined,
            resume_file: undefined as File | undefined,
            academic_background: eduList?.length
                ? eduList.map((e) => {
                    const gradeType = resolveGradeType(e)
                    return {
                        id: (e as { id?: string }).id ?? undefined,
                        qualification: e.qualification ?? "",
                        institution_name: e.institution_name ?? "",
                        grade_type: gradeType,
                        gpa:
                            gradeType === "gpa" && e.gpa != null && e.gpa !== ""
                                ? String(e.gpa)
                                : "",
                        obtained_marks:
                            gradeType === "percentage" &&
                                e.obtained_marks != null &&
                                e.obtained_marks !== ""
                                ? String(e.obtained_marks)
                                : "",
                        total_marks:
                            gradeType === "percentage" &&
                                e.total_marks != null &&
                                e.total_marks !== ""
                                ? String(e.total_marks)
                                : "",
                    }
                })
                : [{
                    qualification: "",
                    institution_name: "",
                    grade_type: "percentage" as GradeType,
                    gpa: "",
                    obtained_marks: "",
                    total_marks: "",
                }],
        } as StudentInput,
        validators: {
            onSubmit: StudentFormSchema,
        },

        onSubmit: async ({ value }) => {
            const fd = new FormData()
            if (value.title) fd.set("title", value.title)
            fd.set("first_name", value.first_name)
            fd.set("last_name", value.last_name)
            fd.set("email", value.email)
            fd.set("phone", value.phone)
            fd.set("dob", value.dob)
            fd.set("gender", value.gender)
            fd.set("country", value.country)
            fd.set("state", value.state)
            fd.set("city", value.city)
            fd.set("nationality", value.nationality)
            fd.set("guardian_email", value.guardian_email)
            fd.set("guardian_phone", value.guardian_phone)
            fd.set("academic_background", JSON.stringify(value.academic_background))
            if (value.avatar_url instanceof File) fd.set("avatar_url", value.avatar_url)
            if (value.passport_file_url instanceof File) fd.set("passport_file_url", value.passport_file_url)
            if (value.cv_file instanceof File) fd.set("cv_file", value.cv_file)
            if (value.resume_file instanceof File) fd.set("resume_file", value.resume_file)

            if (mode === "create" && user?.role === "AGENT") {
                await mutation.mutateAsync({
                    studentFormData: fd,
                    selectedCourseId,
                    pendingFiles,
                    requiredDocTypes,
                    courses,
                    levels
                })
            } else {
                // Original flow for edit mode or non-agent
                const url = mode === "edit" ? `/api/student/${studentId}` : "/api/student"
                const method = mode === "edit" ? "PATCH" : "POST"

                const cvFile = fd.get("cv_file") as File | null
                const resumeFile = fd.get("resume_file") as File | null
                fd.delete("cv_file")
                fd.delete("resume_file")

                const res = await fetch(url, { method, body: fd })
                const json = await res.json()
                if (!res.ok) throw new Error(json?.error ?? "Something went wrong")

                if (mode === "create" && json?.data?.id) {
                    const studentProfileId = json.data.id
                    if (cvFile instanceof File || resumeFile instanceof File) {
                        const docFd = new FormData()
                        if (cvFile instanceof File) docFd.set("cv_file", cvFile)
                        if (resumeFile instanceof File) docFd.set("resume_file", resumeFile)
                        await fetch(`/api/document/student/${studentProfileId}`, { method: "POST", body: docFd })
                    }
                }

                queryClient.invalidateQueries({ queryKey: ["students"] })
                if (mode === "edit") queryClient.invalidateQueries({ queryKey: ["students", studentId] })
                router.push(mode === "edit" ? `/dashboard/student/${studentId}` : "/dashboard/student")
                router.refresh()
            }
        },
    })

    const handleFormSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault()
            e.stopPropagation()
            void form.handleSubmit()
        },
        [form]
    )

    const addRow = useCallback(() => {
        form.setFieldValue("academic_background", (prev: any) => [
            ...prev,
            {
                qualification: "",
                institution_name: "",
                grade_type: "percentage",
                gpa: "",
                obtained_marks: "",
                total_marks: "",
            },
        ])
    }, [form])

    // const removeRow = useCallback((index: number) => {
    //     if (form.getFieldValue("academic_background").length <= 1) return
    //     form.setFieldValue("academic_background", (prev: any) =>
    //         prev.filter((_: any, i: number) => i !== index)
    //     )
    // }, [form])

    return (
        <div className="space-y-8">
            <div className="bg-white/5 p-8 relative overflow-visible">

                <form id="student-form" onSubmit={handleFormSubmit} className="space-y-12 relative z-10">
                    <FieldGroup className="space-y-10">

                        {/* ── Section: Enter Student Details ── */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <Building className="size-5 text-gray-700" strokeWidth={2.5} />
                                <Typography as="h3" font="text-xl" className="text-gray-900 tracking-tight">Enter Student Details</Typography>
                            </div>


                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                                {/* Inputs: First Name, Last Name, Email, Phone */}
                                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="sm:col-span-2">
                                        <form.Field name="title">
                                            {(field) => (
                                                <F field={field} label="Title">
                                                    <Select
                                                        value={field.state.value}
                                                        onValueChange={(v) => field.handleChange(v)}
                                                    >
                                                        <SelectTrigger id={field.name} className="h-12"><SelectValue placeholder="Select Title" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Mr">Mr</SelectItem>
                                                            <SelectItem value="Mrs">Mrs</SelectItem>
                                                            <SelectItem value="Ms">Ms</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </F>
                                            )}
                                        </form.Field>
                                    </div>

                                    <form.Field name="first_name">
                                        {(field) => (
                                            <F field={field} label="First Name">
                                                <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Enter first name" />
                                            </F>
                                        )}
                                    </form.Field>

                                    <form.Field name="last_name">
                                        {(field) => (
                                            <F field={field} label="Last Name">
                                                <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Enter last name" />
                                            </F>
                                        )}
                                    </form.Field>

                                    <form.Field name="email">
                                        {(field) => (
                                            <F field={field} label="Email">
                                                <Input id={field.name} type="email" value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Enter your email" />
                                            </F>
                                        )}
                                    </form.Field>

                                        <form.Field name="phone">
                                            {(field) => (
                                                <F field={field} label="Phone">
                                                    <PhoneInputComponent
                                                        value={field.state.value}
                                                        onChange={(value) => field.handleChange(value)}
                                                        placeholder="Enter phone number"
                                                    />
                                                </F>
                                            )}
                                        </form.Field>
                                </div>

                                {/* Avatar Upload */}
                                <div className="lg:col-span-1 h-full">
                                    <form.Field name="avatar_url">
                                        {(field) => (
                                            <div className="space-y-2 h-full flex flex-col">
                                                <Typography font="small" className="text-gray-900">Upload Profile Picture</Typography>

                                                <ImageUploadCard
                                                    value={field.state.value ?? (defaultData?.avatar_url ?? null)}
                                                    onChange={(file) => field.handleChange(file as unknown as File)}
                                                    message="Passport size picture"
                                                    className="w-full h-full min-h-[150px] lg:min-h-[200px]"
                                                />
                                            </div>
                                        )}
                                    </form.Field>
                                </div>
                            </div>
                        </div>

                        {/* ── Section: Basic Info ── */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 pb-2">
                                <FileUp className="size-5" strokeWidth={2.5} />
                                <Typography as="h3" font="text-lg" className="font-bold">Basic Info</Typography>
                                <ChevronDown className="size-5 text-gray-500" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                <form.Field name="guardian_phone">
                                    {(field) => (
                                        <F field={field} label="Parent/Guardian Phone">
                                            <PhoneInputComponent
                                                value={field.state.value}
                                                onChange={(value) => field.handleChange(value)}
                                                placeholder="Enter phone number"
                                            />
                                        </F>
                                    )}
                                </form.Field>

                                <form.Field name="dob">
                                    {(field) => (
                                        <F field={field} label="Date Of Birth">
                                            <DatePicker
                                                value={field.state.value}
                                                onChange={(v) => {
                                                    field.handleChange(v)
                                                    field.handleBlur()
                                                }}
                                                placeholder="Select date of birth"
                                            />
                                        </F>
                                    )}
                                </form.Field>

                                <form.Field name="gender">
                                    {(field) => (
                                        <F field={field} label="Select Gender">
                                            <Select
                                                value={field.state.value || undefined}
                                                onValueChange={(v) => {
                                                    field.handleChange(v as "MALE" | "FEMALE")
                                                    field.handleBlur()
                                                }}
                                            >
                                                <SelectTrigger className="h-12"><SelectValue placeholder="Select your gender" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="MALE">Male</SelectItem>
                                                    <SelectItem value="FEMALE">Female</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </F>
                                    )}
                                </form.Field>

                                <form.Field name="country">
                                    {(field) => (
                                        <F field={field} label="Country">
                                            <CountrySelect
                                                value={field.state.value}
                                                onValueChange={(v) => {
                                                    field.handleChange(v)
                                                    field.handleBlur()
                                                }}
                                            />
                                        </F>
                                    )}
                                </form.Field>

                                <form.Field name="state">
                                    {(field) => (
                                        <F field={field} label="State">
                                            <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Enter state" />
                                        </F>
                                    )}
                                </form.Field>

                                <form.Field name="city">
                                    {(field) => (
                                        <F field={field} label="City">
                                            <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Enter city" />
                                        </F>
                                    )}
                                </form.Field>

                                <form.Field name="guardian_email">
                                    {(field) => (
                                        <F field={field} label="Parent/Guardian Email">
                                            <Input id={field.name} type="email" value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Enter your guardian Email" />
                                        </F>
                                    )}
                                </form.Field>

                                    <form.Field name="nationality">
                                        {(field) => (
                                            <F field={field} label="Nationality">
                                                <Input
                                                    id={field.name}
                                                    value={field.state.value}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                    placeholder="Enter nationality"
                                                />
                                            </F>
                                        )}
                                    </form.Field>

                                <div className="col-span-1 sm:col-span-2 lg:col-span-1">
                                    <form.Field name="passport_file_url">
                                        {(field) => (
                                            <div className="space-y-2">
                                                <Typography font="small" className="text-gray-900">Upload Passport</Typography>

                                                <ImageUploadCard
                                                    value={field.state.value ?? (defaultData?.student?.passport_file_url ?? null)}
                                                    onChange={(file) => field.handleChange(file as unknown as File)}
                                                    message="Passport picture"
                                                    className="w-full max-h-[200px]"
                                                />
                                            </div>
                                        )}
                                    </form.Field>
                                </div>

                                <form.Field name="cv_file">
                                    {(field) => (
                                        <F field={field} label="CV (Required)">
                                            <Input
                                                id="cv_file"
                                                type="file"
                                                accept=".pdf,.doc,.docx"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) field.handleChange(file as unknown as File)
                                                }}
                                                className="h-12"
                                            />
                                        </F>
                                    )}
                                </form.Field>

                                <form.Field name="resume_file">
                                    {(field) => (
                                        <F field={field} label="Resume (Required)">
                                            <Input
                                                id="resume_file"
                                                type="file"
                                                accept=".pdf,.doc,.docx"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) field.handleChange(file as unknown as File)
                                                }}
                                                className="h-12"
                                            />
                                        </F>
                                    )}
                                </form.Field>
                            </div>
                        </div>

                        {/* ── Section: Academic Background ── */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <School className="size-5" />
                                    <Typography as="h3" className="font-bold">
                                        Academic Background
                                    </Typography>
                                </div>
                            </div>

                            <form.Field name="academic_background" mode="array">
                                {(field) => (
                                    <div className="space-y-6">
                                        {field.state.value.map((_, index) => (
                                            <form.Subscribe
                                                key={index}
                                                selector={(state) => state.values.academic_background[index]?.grade_type}
                                            >
                                                {(gradeType) => {
                                                    const isGpa = gradeType === "gpa"

                                                    return (
                                                        <div className="flex flex-col md:flex-row flex-wrap gap-4">
                                                            <form.Field name={`academic_background[${index}].qualification`}>
                                                                {(subField) => (
                                                                    <div className="flex-1 min-w-[200px]">
                                                                        <F field={subField} label="Highest Degree">
                                                                            <Select
                                                                                value={subField.state.value || undefined}
                                                                                onValueChange={(v) => {
                                                                                    subField.handleChange(v)
                                                                                    subField.handleBlur()
                                                                                }}
                                                                                disabled={loadingDegrees}
                                                                            >
                                                                                <SelectTrigger className="h-12">
                                                                                    <SelectValue
                                                                                        placeholder={
                                                                                            loadingDegrees
                                                                                                ? "Loading degrees..."
                                                                                                : "Select highest degree"
                                                                                        }
                                                                                    />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    {!degrees.some(
                                                                                        (d) => d.id === subField.state.value
                                                                                    ) &&
                                                                                        subField.state.value && (
                                                                                            <SelectItem value={subField.state.value}>
                                                                                                {subField.state.value}
                                                                                            </SelectItem>
                                                                                        )}
                                                                                    {degrees.map((degree) => (
                                                                                        <SelectItem key={degree.id} value={degree.id}>
                                                                                            {formatDegreeLabel(degree)}
                                                                                        </SelectItem>
                                                                                    ))}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </F>
                                                                    </div>
                                                                )}
                                                            </form.Field>

                                                            <form.Field name={`academic_background[${index}].institution_name`}>
                                                                {(subField) => (
                                                                    <div className="flex-1 min-w-[200px]">
                                                                        <F field={subField} label="Institution Name">
                                                                            <Input
                                                                                placeholder="Enter institution"
                                                                                value={subField.state.value}
                                                                                onBlur={subField.handleBlur}
                                                                                onChange={(e) =>
                                                                                    subField.handleChange(e.target.value)
                                                                                }
                                                                            />
                                                                        </F>
                                                                    </div>
                                                                )}
                                                            </form.Field>

                                                            <form.Field name={`academic_background[${index}].grade_type`}>
                                                                {(subField) => (
                                                                    <div className="flex-1 min-w-[160px]">
                                                                        <F field={subField} label="Grade Type">
                                                                            <Select
                                                                                value={subField.state.value}
                                                                                onValueChange={(v: GradeType) => {
                                                                                    subField.handleChange(v)
                                                                                    subField.handleBlur()
                                                                                    if (v === "gpa") {
                                                                                        form.setFieldValue(
                                                                                            `academic_background[${index}].obtained_marks`,
                                                                                            ""
                                                                                        )
                                                                                        form.setFieldValue(
                                                                                            `academic_background[${index}].total_marks`,
                                                                                            ""
                                                                                        )
                                                                                    } else {
                                                                                        form.setFieldValue(
                                                                                            `academic_background[${index}].gpa`,
                                                                                            ""
                                                                                        )
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <SelectTrigger className="h-12">
                                                                                    <SelectValue placeholder="Select grade type" />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    <SelectItem value="percentage">Percentage</SelectItem>
                                                                                    <SelectItem value="gpa">GPA</SelectItem>
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </F>
                                                                    </div>
                                                                )}
                                                            </form.Field>

                                                            {isGpa ? (
                                                                <form.Field name={`academic_background[${index}].gpa`}>
                                                                    {(subField) => (
                                                                        <div className="flex-1 min-w-[140px]">
                                                                            <F field={subField} label="GPA">
                                                                                <Input
                                                                                    type="number"
                                                                                    step="0.01"
                                                                                    min="0"
                                                                                    max="4"
                                                                                    placeholder="e.g. 3.5"
                                                                                    value={subField.state.value}
                                                                                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                                    onBlur={subField.handleBlur}
                                                                                    onChange={(e) =>
                                                                                        subField.handleChange(e.target.value)
                                                                                    }
                                                                                    onKeyDown={(e) =>
                                                                                        ["e", "E", "-", "+"].includes(e.key) &&
                                                                                        e.preventDefault()
                                                                                    }
                                                                                />
                                                                            </F>
                                                                        </div>
                                                                    )}
                                                                </form.Field>
                                                            ) : (
                                                                <>
                                                                    <form.Field name={`academic_background[${index}].obtained_marks`}>
                                                                        {(subField) => (
                                                                            <div className="flex-1 min-w-[140px]">
                                                                                <F field={subField} label="Obtained Marks">
                                                                                    <Input
                                                                                        type="number"
                                                                                        placeholder="e.g. 850"
                                                                                        value={subField.state.value}
                                                                                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                                        onBlur={subField.handleBlur}
                                                                                        onChange={(e) =>
                                                                                            subField.handleChange(e.target.value)
                                                                                        }
                                                                                        onKeyDown={(e) =>
                                                                                            ["e", "E", "-", "+"].includes(e.key) &&
                                                                                            e.preventDefault()
                                                                                        }
                                                                                    />
                                                                                </F>
                                                                            </div>
                                                                        )}
                                                                    </form.Field>

                                                                    <form.Field name={`academic_background[${index}].total_marks`}>
                                                                        {(subField) => (
                                                                            <div className="flex-1 min-w-[140px]">
                                                                                <F field={subField} label="Total Marks">
                                                                                    <Input
                                                                                        type="number"
                                                                                        placeholder="e.g. 1100"
                                                                                        value={subField.state.value}
                                                                                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                                        onBlur={subField.handleBlur}
                                                                                        onChange={(e) =>
                                                                                            subField.handleChange(e.target.value)
                                                                                        }
                                                                                        onKeyDown={(e) =>
                                                                                            ["e", "E", "-", "+"].includes(e.key) &&
                                                                                            e.preventDefault()
                                                                                        }
                                                                                    />
                                                                                </F>
                                                                            </div>
                                                                        )}
                                                                    </form.Field>
                                                                </>
                                                            )}
                                                        </div>
                                                    )
                                                }}
                                            </form.Subscribe>
                                        ))}
                                    </div>
                                )}
                            </form.Field>
                            {/* <div className="flex justify-end">
                                <Button
                                    type="button"
                                    size="lg"
                                    className="font-light"
                                    variant="ghost"
                                    onClick={addRow}
                                >
                                    + Add More
                                </Button>
                            </div> */}
                        </div>

                        {/* ── Section: Course Selection & Documents (Only for Agent Create) ── */}
                        {mode === "create" && user?.role === "AGENT" && (
                            <>
                                {/* Course Selection */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2">
                                        <School className="size-5 text-gray-700" strokeWidth={2.5} />
                                        <Typography as="h3" font="text-xl" className="text-gray-900 tracking-tight">Select Course (Optional)</Typography>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Select
                                                value={selectedCourseId}
                                                onValueChange={(val) => {
                                                    setSelectedCourseId(val);
                                                    setSelectedDocumentIds([]);
                                                    if (createdStudentId) {
                                                        refetchDocuments();
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="h-12">
                                                    <SelectValue placeholder="Select a course" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {courses.map((course) => (
                                                        <SelectItem key={course.id} value={course.id}>
                                                            {course.name} - {formatProgramDate(course.deadline_date)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* Supporting Documents */}
                                {selectedCourseId && (
                                    <SupportingDocumentsSection
                                        documents={documents}
                                        requiredDocTypes={requiredDocTypes}
                                        selectedCourseId={selectedCourseId}
                                        selectedStudentId={createdStudentId || ""}
                                        refetchDocuments={refetchDocuments}
                                        selectedDocumentIds={selectedDocumentIds}
                                        onDocumentSelect={setSelectedDocumentIds}
                                        isDocumentsLoading={isDocumentsLoading}
                                        pendingFiles={pendingFiles}
                                        setPendingFiles={setPendingFiles}
                                        isUploading={isUploading}
                                    />
                                )}
                            </>
                        )}

                        {apiError && (
                            <div className="space-y-3">
                                <ErrorView message={apiError} />
                            </div>
                        )}

                        <div className="border-t border-gray-200/40 pt-8 flex justify-end w-full">
                            <form.Subscribe selector={s => s.isSubmitting}>
                                {(isSubmitting) => (
                                    <Button
                                        type="submit"
                                        className="w-full sm:w-auto sm:min-w-[200px] h-12 bg-brand-byzantine hover:bg-brand-byzantine/90 text-white rounded-sm text-sm font-bold transition-all"
                                        disabled={isSubmitting || mutation.isPending}
                                    >
                                        {mutation.isPending ? "Processing..." : selectedCourseId ? "Create Student & Application" : mode === "edit" ? "Update Student" : "Register"}
                                    </Button>
                                )}
                            </form.Subscribe>
                        </div>
                    </FieldGroup>
                </form>
            </div>
        </div>

    )
}
