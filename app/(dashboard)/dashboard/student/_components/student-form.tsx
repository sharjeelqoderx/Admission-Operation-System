"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useStore } from "@tanstack/react-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/hooks/useAuth"
import { StudentCreateFormSchema, StudentFormSchema, type StudentInput } from "@/types/schemas/student"
import { Typography } from "@/components/shared/Typography"
import { ErrorView } from "@/components/shared/error-view"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import ImageUploadCard from "@/components/shared/image-upload-card"
import { DatePicker } from "@/components/shared/date-picker"
import { CountrySelect } from "@/components/shared/country-select"
import { StateSelect } from "@/components/shared/state-select"
import { CitySelect } from "@/components/shared/city-select"
import { AddressFormFieldGroup } from "@/components/shared/address-form-field-group"
import { Building, ChevronDown, School, FileUp, FileText, Plus, Upload, X, ClipboardList } from "lucide-react"
import { PageLoader, Spinner } from "@/components/shared/page-loader"
import { resolveGradeTypeOptional, type GradeType } from "@/types/schemas/academic"
import { Role } from "@/types/enums/role"
import {
    filterCoursesByHighestEducation,
    getHighestEducationLabel,
    HIGHEST_EDUCATION_OPTIONS,
    isHighestEducationLevel,
    normalizeHighestEducationFromStored,
} from "@/types/schemas/highest-education"
import { toast } from "sonner"
import { FilePreview } from "@/components/shared/FilePreview"
import { cn } from "@/lib/utils"
import { isFileWithinSizeLimit, MAX_FILE_SIZE_ERROR_MESSAGE } from "@/lib/constants/file-upload"
import { useLevels } from "@/hooks/useLevels"
import type { CourseProgram } from "@/types/schemas/program"
import { formatIntakeDate, formatProgramDate } from "@/lib/utils/program"
import { resolveCourseDocumentTypesForCourses } from "@/lib/utils/course-documents"
import { resolveApsDocumentType, withApsRequiredDocument } from "@/lib/utils/aps"
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
import type { StudentFormPageData } from "@/lib/student/server"
import type { UserRole } from "@/types"
import { QualificationUpgradeDialog } from "@/components/shared/qualification-upgrade-dialog"
import {
    getQualificationSnapshotFromEducation,
    getQualificationUpgradeMessage,
    invalidateQualificationDocumentQueries,
    isQualificationUpgrade,
    type QualificationSnapshot,
} from "@/lib/utils/qualification-upgrade"

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

function buildStudentFormData(value: StudentInput): FormData {
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
    fd.set("street_1", value.street_1)
    fd.set("street_2", value.street_2 ?? "")
    fd.set("street_3", value.street_3 ?? "")
    fd.set("post_code", value.post_code ?? "")
    fd.set("guardian_email", value.guardian_email)
    fd.set("guardian_phone", value.guardian_phone)
    fd.set("academic_background", JSON.stringify(value.academic_background))
    if (value.avatar_url instanceof File) fd.set("avatar_url", value.avatar_url)
    if (value.passport_file_url instanceof File) fd.set("passport_file_url", value.passport_file_url)
    return fd
}

function genderFromTitle(title: string): "MALE" | "FEMALE" | undefined {
    switch (title) {
        case "Mr":
            return "MALE"
        case "Mrs":
        case "Ms":
            return "FEMALE"
        default:
            return undefined
    }
}

function DocumentUploadField({
    id,
    value,
    onChange,
    accept,
}: {
    id: string
    value?: File | null
    onChange: (file: File | null) => void
    accept: string
}) {
    const inputRef = useRef<HTMLInputElement>(null)

    const handleSelect = (file: File | null) => {
        if (!file) {
            onChange(null)
            if (inputRef.current) inputRef.current.value = ""
            return
        }
        if (!isFileWithinSizeLimit(file)) {
            alert(MAX_FILE_SIZE_ERROR_MESSAGE)
            if (inputRef.current) inputRef.current.value = ""
            return
        }
        onChange(file)
    }

    return (
        <div className="flex items-center gap-3 h-12 w-full min-w-0 rounded-sm border border-input bg-brand-input px-3">
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex shrink-0 items-center justify-center size-9 rounded-md text-brand-byzantine hover:bg-brand-byzantine/10 transition-colors"
                aria-label="Upload file"
            >
                <Upload className="size-5" />
            </button>
            <Typography
                font="small"
                className={cn("truncate flex-1 min-w-0", !value && "text-muted-foreground")}
            >
                {value?.name ?? "No file selected"}
            </Typography>
            {value && (
                <button
                    type="button"
                    onClick={() => handleSelect(null)}
                    className="flex shrink-0 items-center justify-center size-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    aria-label="Remove file"
                >
                    <X className="size-4" />
                </button>
            )}
            <input
                ref={inputRef}
                id={id}
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e) => handleSelect(e.target.files?.[0] ?? null)}
            />
        </div>
    )
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

type Props = {
    mode: "create" | "edit"
    studentId?: string
    defaultData?: StudentFormPageData
    initialUser?: { id: string; role: UserRole } | null
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
    onUploaded: () => void;
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
            onUploaded();
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
                                <Spinner size="sm" />
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

function hasUploadedApplicationDocument(
    documentTypeId: string,
    pendingFiles: Record<string, { front: File | null; back: File | null }>,
    documents: Document[]
): boolean {
    if (pendingFiles[documentTypeId]?.front) return true
    return documents.some(
        (doc) => (doc.document_type?.id ?? doc.document_type_id) === documentTypeId
    )
}

const CourseSelect = React.memo(function CourseSelect({
    courses,
    selectedCourseIds,
    onChange,
}: {
    courses: CourseProgram[]
    selectedCourseIds: string[]
    onChange: (courseIds: string[]) => void
}) {
    const formatCourseSelectLabel = useCallback((course: CourseProgram) => {
        const meta = [course.degree?.level?.name, formatProgramDate(course.deadline_date)]
            .filter(Boolean)
            .join(" • ")

        return meta ? `${course.name} — ${meta}` : course.name
    }, [])

    if (courses.length === 0) {
        return (
            <div className="col-span-full space-y-2">
                <FieldLabel>Courses</FieldLabel>
                <Select disabled>
                    <SelectTrigger className="h-12 w-full min-w-0 max-w-lg">
                        <SelectValue placeholder="No courses available for this qualification level." />
                    </SelectTrigger>
                </Select>
            </div>
        )
    }

    return (
        <div className="col-span-full space-y-2 min-w-0">
            <FieldLabel>Courses</FieldLabel>
            <Select
                value={selectedCourseIds[0] || undefined}
                onValueChange={(val) => onChange(val ? [val] : [])}
            >
                <SelectTrigger className="h-12 w-full min-w-0 max-w-lg">
                    <SelectValue placeholder="Select a course" className="truncate" />
                </SelectTrigger>
                <SelectContent
                    className="max-h-60 w-[var(--radix-select-trigger-width)] overflow-hidden"
                    position="popper"
                    align="start"
                >
                    {courses.map((course) => {
                        const label = formatCourseSelectLabel(course)

                        return (
                            <SelectItem
                                key={course.id}
                                value={course.id}
                                title={label}
                                className="min-w-0 overflow-hidden [&>span:last-child]:!block [&>span:last-child]:!min-w-0 [&>span:last-child]:truncate"
                            >
                                {label}
                            </SelectItem>
                        )
                    })}
                </SelectContent>
            </Select>
        </div>
    )
})

function SupportingDocumentsSection({
    documents,
    requiredDocTypes,
    optionalDocTypes = [],
    hasSelectedCourses,
    selectedStudentId,
    refetchDocuments,
    isDocumentsLoading,
    isRequiredDocsLoading,
    pendingFiles,
    setPendingFiles,
    isUploading,
}: {
    documents: Document[];
    requiredDocTypes: { id: string; name: string }[];
    optionalDocTypes?: { id: string; name: string }[];
    hasSelectedCourses: boolean;
    selectedStudentId: string;
    refetchDocuments: () => Promise<unknown>;
    isDocumentsLoading?: boolean;
    isRequiredDocsLoading?: boolean;
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

    const handleDocumentUploaded = useCallback(async () => {
        await refetchDocuments();
    }, [refetchDocuments]);

    const renderDocumentCards = useCallback(
        (docTypes: { id: string; name: string }[], isRequired: boolean) => (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {docTypes.map((rt) => {
                    const doc = documents.find(
                        (d) => (d.document_type?.id ?? d.document_type_id) === rt.id
                    );
                    const hasPending = pendingFiles[rt.id]?.front;

                    if (isUploading[rt.id]) {
                        return (
                            <div
                                key={rt.id}
                                className="bg-[#f8f9fc] rounded-xl p-3 space-y-3 relative border-2 border-purple-400 bg-purple-50/30 shadow-md cursor-not-allowed group"
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
                        );
                    }

                    if (doc) {
                        return (
                            <div
                                key={rt.id}
                                className="bg-[#f8f9fc] rounded-xl p-3 space-y-3 relative border border-green-500 bg-green-50/30 shadow-md group"
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
                        );
                    }

                    if (hasPending && !selectedStudentId) {
                        return (
                            <div
                                key={rt.id}
                                className="bg-[#f8f9fc] rounded-xl p-3 space-y-3 relative border-2 border-yellow-400 bg-yellow-50/30 shadow-md cursor-pointer group"
                                onClick={() => openLocalUploadModal(rt)}
                            >
                                <div className="aspect-square bg-white rounded-lg flex items-center justify-center overflow-hidden border border-gray-100 shadow-inner">
                                    <FileText className="size-10 text-yellow-500" />
                                </div>
                                <div>
                                    <RequiredDocumentTitle name={rt.name} />
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
                            onClick={() => openLocalUploadModal(rt)}
                            className={cn(
                                "rounded-xl p-3 space-y-3 relative border-2 border-dashed flex flex-col items-center justify-center gap-2 min-h-[140px] transition-all group w-full",
                                isRequired
                                    ? "bg-red-50/50 border-red-200 hover:bg-red-50 hover:border-red-300"
                                    : "bg-gray-50/50 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                            )}
                        >
                            <div
                                className={cn(
                                    "size-10 rounded-full flex items-center justify-center transition-colors",
                                    isRequired
                                        ? "bg-red-100 group-hover:bg-red-200"
                                        : "bg-gray-100 group-hover:bg-gray-200"
                                )}
                            >
                                <FileText
                                    className={cn("size-5", isRequired ? "text-red-400" : "text-gray-400")}
                                />
                            </div>
                            <div className="text-center w-full min-w-0 px-1">
                                <RequiredDocumentTitle
                                    name={rt.name}
                                    className={cn("text-center", isRequired ? "text-red-600" : "text-gray-700")}
                                />
                                <Typography
                                    as="p"
                                    className={cn(
                                        "text-[9px] mt-0.5",
                                        isRequired ? "text-red-400" : "text-gray-400"
                                    )}
                                >
                                    {isRequired ? "Required — click to upload" : "Optional — click to upload"}
                                </Typography>
                            </div>
                        </button>
                    );
                })}
            </div>
        ),
        [documents, pendingFiles, isUploading, selectedStudentId, openLocalUploadModal]
    );

    if (!hasSelectedCourses) {
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
        <TooltipProvider delayDuration={200}>
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

                {isRequiredDocsLoading || isDocumentsLoading ? (
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
                ) : documents.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {documents.map((doc) => {
                            const label = doc.document_type?.name ?? "Document";
                            return (
                                <div
                                    key={doc.id}
                                    className="bg-[#f8f9fc] rounded-xl p-3 space-y-3 relative border border-green-500 bg-green-50/30 shadow-md group"
                                >
                                    <div className="aspect-square bg-white rounded-lg flex items-center justify-center overflow-hidden border border-gray-100 shadow-inner">
                                        {doc.document_files?.[0]?.file_url ? (
                                            <FilePreview
                                                url={doc.document_files[0].file_url}
                                                name={label}
                                                showActions={false}
                                                className="border-none shadow-none size-full"
                                            />
                                        ) : (
                                            <FileText className="size-10 text-green-500" />
                                        )}
                                    </div>
                                    <div>
                                        <RequiredDocumentTitle name={label} />
                                        <Typography as="p" className="text-[8px] font-bold tracking-widest text-green-600 uppercase mt-1">
                                            Attached
                                        </Typography>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="col-span-full py-12 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center gap-4">
                        <FileText className="size-6 text-gray-400" />
                        <Typography as="p" className="text-sm font-bold text-gray-900">No supporting documents required</Typography>
                        <Typography as="p" className="text-xs text-gray-500">This program does not require additional supporting documents.</Typography>
                    </div>
                )}
            </div>
        </>
        </TooltipProvider>
    );
}

export function StudentForm({ mode, studentId, defaultData, initialUser }: Props) {
    const router = useRouter()
    const queryClient = useQueryClient()

    const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
    const [applicationDocError, setApplicationDocError] = useState<string | null>(null);
    const [createdStudentId, setCreatedStudentId] = useState<string | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isDocumentsLoading, setIsDocumentsLoading] = useState(false);
    const [pendingFiles, setPendingFiles] = useState<Record<string, { front: File | null; back: File | null }>>({});
    const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});
    const [qualificationUpgradeNotice, setQualificationUpgradeNotice] = useState({
        open: false,
        title: "",
        description: "",
    });

    const eduListForSnapshot = Array.isArray(defaultData?.education)
        ? defaultData.education
        : defaultData?.education
            ? [defaultData.education]
            : null
    const initialQualificationSnapshot = useMemo(
        () => getQualificationSnapshotFromEducation(eduListForSnapshot?.[0] ?? null),
        [eduListForSnapshot]
    )
    const trackedQualificationRef = useRef<QualificationSnapshot>(initialQualificationSnapshot)
    const qualificationUpgradeDetectedRef = useRef(false)

    const { me } = useAuth()
    const user = me.data ?? initialUser ?? undefined

    const { data: programsResponse } = useQuery({
        queryKey: ["programs"],
        queryFn: async () => {
            const res = await fetch("/api/program?limit=100");
            if (!res.ok) throw new Error("Failed to fetch courses");
            return res.json();
        }
    });
    const courses: CourseProgram[] = Array.isArray(programsResponse?.data) ? programsResponse.data : [];
    const { data: levels = [] } = useLevels();

    const { data: allDocumentTypes = [] } = useQuery({
        queryKey: ["document-types"],
        queryFn: async () => {
            const res = await fetch("/api/document-type");
            if (!res.ok) throw new Error("Failed to fetch document types");
            const json = await res.json();
            return (json.data ?? []) as { id: string; name: string }[];
        },
        enabled: mode === "create" && user?.role === Role.AGENT,
    });

    const refetchDocuments = useCallback(async () => {
        if (!createdStudentId) return;
        setIsDocumentsLoading(true);
        try {
            const res = await fetch(`/api/document/student/${createdStudentId}`);
            if (!res.ok) throw new Error("Failed to fetch documents");
            const json = await res.json();
            setDocuments(Array.isArray(json?.data) ? json.data : []);
        } finally {
            setIsDocumentsLoading(false);
        }
    }, [createdStudentId]);

    const clearCourseSelection = useCallback(() => {
        setSelectedCourseIds([])
        setApplicationDocError(null)
    }, [])

    const handleQualificationChange = useCallback(
        (
            previousQualification: string | undefined,
            nextQualification: string,
            applyChange: () => void
        ) => {
            const previousSnapshot: QualificationSnapshot = previousQualification
                ? { qualification: previousQualification }
                : trackedQualificationRef.current
            const nextSnapshot: QualificationSnapshot = { qualification: nextQualification }

            if (isQualificationUpgrade(previousSnapshot, nextSnapshot)) {
                const message = getQualificationUpgradeMessage(previousSnapshot, nextSnapshot)
                qualificationUpgradeDetectedRef.current = true
                setQualificationUpgradeNotice({
                    open: true,
                    title: message.title,
                    description: message.description,
                })
                clearCourseSelection()
                setPendingFiles({})
                invalidateQualificationDocumentQueries(queryClient, createdStudentId ?? studentId ?? undefined)
                if (createdStudentId) {
                    void refetchDocuments()
                }
            } else if (previousQualification !== nextQualification) {
                clearCourseSelection()
                setPendingFiles({})
            }

            applyChange()
            trackedQualificationRef.current = nextSnapshot
        },
        [clearCourseSelection, createdStudentId, queryClient, refetchDocuments, studentId]
    )

    const handleCourseSelectionChange = useCallback((courseIds: string[]) => {
        setSelectedCourseIds(courseIds)
        setApplicationDocError(null)
    }, [])

    // Refetch documents when student is created
    useEffect(() => {
        if (createdStudentId) {
            refetchDocuments();
        }
    }, [createdStudentId, refetchDocuments]);

    const mutation = useMutation({
        mutationFn: async ({
            formValues,
            selectedCourseIds,
            pendingFiles,
            courses,
            levels
        }: {
            formValues: StudentInput,
            selectedCourseIds: string[],
            pendingFiles: Record<string, { front: File | null; back: File | null }>,
            courses: CourseProgram[],
            levels: any[]
        }) => {
            // Step 1: Create student
            const studentRes = await fetch("/api/student", {
                method: "POST",
                body: buildStudentFormData(formValues),
            });
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

            // Step 3: Collect all uploaded document IDs (passport, course-required docs)
            const docsRes = await fetch(`/api/document/student/${newStudentProfileId}`);
            const docsJson = docsRes.ok ? await docsRes.json() : { data: [] };
            const documentIds = [
                ...new Set([
                    ...uploadedDocIds,
                    ...((docsJson.data ?? []) as { id: string }[]).map((d) => d.id),
                ]),
            ];

            // Step 4: Create applications when courses are selected (optional)
            if (selectedCourseIds.length > 0) {
                for (const courseId of selectedCourseIds) {
                    let universityId = "";
                    const course = courses.find((c) => c.id === courseId);
                    if (course) {
                        const levelId = course.degree?.level_id;
                        universityId = levels.find((level) => level.id === levelId)?.university_id ?? "";
                    }

                    const appRes = await fetch("/api/application", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            profile_id: newStudentProfileId,
                            course_id: courseId,
                            university_id: universityId,
                            document_ids: documentIds,
                            intake_date: course?.degree?.intake_date ?? "summer",
                            declarations: [true, true, true],
                        })
                    });
                    const appJson = await appRes.json();
                    if (!appRes.ok) {
                        throw new Error(appJson?.error ?? "Failed to create application");
                    }
                }
            }

            return { studentJson, applicationCount: selectedCourseIds.length };
        },
        onSuccess: ({ applicationCount }) => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
            queryClient.invalidateQueries({ queryKey: ["applications"] });
            if (applicationCount > 0) {
                toast.success(
                    applicationCount === 1
                        ? "Student and application created successfully!"
                        : `Student and ${applicationCount} applications created successfully!`
                );
                router.push("/dashboard/application");
            } else {
                toast.success("Student created successfully!");
                router.push("/dashboard/student");
            }
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
            first_name: defaultData?.first_name ?? defaultData?.name?.split(" ")[0] ?? "",
            last_name: defaultData?.last_name ?? defaultData?.name?.split(" ").slice(1).join(" ") ?? "",
            email: defaultData?.email ?? "",
            phone: defaultData?.phone ?? "",
            dob: defaultData?.date_of_birth ?? "",
            gender: (() => {
                const fromData = defaultData?.gender?.toUpperCase()
                if (fromData === "MALE" || fromData === "FEMALE") {
                    return fromData as "MALE" | "FEMALE"
                }
                return genderFromTitle(defaultData?.title ?? "")
            })(),
            country: defaultData?.student?.country ?? "",
            state: defaultData?.student?.state ?? "",
            city: defaultData?.student?.city ?? "",
            nationality:
                defaultData?.student?.nationality ??
                defaultData?.student?.country ??
                "",
            street_1: defaultData?.student?.street_1 ?? defaultData?.student?.address ?? "",
            street_2: defaultData?.student?.street_2 ?? "",
            street_3: defaultData?.student?.street_3 ?? "",
            post_code: defaultData?.student?.post_code ?? defaultData?.student?.zip_code ?? "",
            guardian_email: defaultData?.student?.guardian_email ?? "",
            guardian_phone: defaultData?.student?.guardian_phone ?? "",
            avatar_url: undefined as File | undefined,
            passport_file_url: undefined as File | undefined,
            academic_background: eduList?.length
                ? eduList.map((e) => {
                    const gradeType = resolveGradeTypeOptional(e)
                    return {
                        id: (e as { id?: string }).id?.trim() || undefined,
                        qualification:
                            normalizeHighestEducationFromStored(
                                e.qualification,
                                (
                                    e as {
                                        qualification_degree?: {
                                            level?: { name?: string | null } | null
                                        } | null
                                    }
                                ).qualification_degree?.level?.name
                            ) ||
                            (e.qualification && !isHighestEducationLevel(e.qualification)
                                ? e.qualification
                                : ""),
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
                    grade_type: "",
                    gpa: "",
                    obtained_marks: "",
                    total_marks: "",
                }],
        } as StudentInput,
        validators: {
            onSubmit: mode === "create" ? StudentCreateFormSchema : StudentFormSchema,
        },

        onSubmit: async ({ value }) => {
            if (mode === "create" && user?.role === Role.AGENT) {
                if (selectedCourseIds.length > 0) {
                    const missingDocs = applicationRequiredDocTypes.filter(
                        (docType) =>
                            !hasUploadedApplicationDocument(
                                docType.id,
                                pendingFiles,
                                documents
                            )
                    );

                    if (missingDocs.length > 0) {
                        setApplicationDocError(
                            `Please upload required documents: ${missingDocs.map((doc) => doc.name).join(", ")}`
                        );
                        return;
                    }
                }

                setApplicationDocError(null);
                await mutation.mutateAsync({
                    formValues: value,
                    selectedCourseIds,
                    pendingFiles,
                    courses,
                    levels
                })
            } else {
                // Original flow for edit mode or non-agent
                const url = mode === "edit" ? `/api/student/${studentId}` : "/api/student"
                const method = mode === "edit" ? "PATCH" : "POST"

                const res = await fetch(url, { method, body: buildStudentFormData(value) })
                const json = await res.json()
                if (!res.ok) throw new Error(json?.error ?? "Something went wrong")

                queryClient.invalidateQueries({ queryKey: ["students"] })
                if (mode === "edit") {
                    queryClient.invalidateQueries({ queryKey: ["students", studentId] })
                    if (qualificationUpgradeDetectedRef.current && studentId) {
                        invalidateQualificationDocumentQueries(queryClient, studentId)
                    }
                }
                router.push(mode === "edit" ? `/dashboard/student/${studentId}` : "/dashboard/student")
                router.refresh()
            }
        },
    })

    const studentCountry = useStore(form.store, (state) => state.values.country)

    const { required: applicationRequiredDocTypes, optional: applicationOptionalDocTypes } = useMemo(
        () =>
            withApsRequiredDocument(
                resolveCourseDocumentTypesForCourses(courses, selectedCourseIds, allDocumentTypes),
                studentCountry,
                resolveApsDocumentType(allDocumentTypes)
            ),
        [selectedCourseIds, courses, allDocumentTypes, studentCountry]
    )

    const handleFormSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault()
            e.stopPropagation()

            const mappedGender = genderFromTitle(String(form.getFieldValue("title") ?? ""))
            if (mappedGender) {
                form.setFieldValue("gender", mappedGender)
            }

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
                grade_type: "",
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
            <div className="bg-white/5 p-4 sm:p-6 lg:p-8 relative overflow-hidden">

                <form id="student-form" onSubmit={handleFormSubmit} className="space-y-12 relative z-10">
                    <FieldGroup className="space-y-10">

                        {/* ── Section: Enter Student Details ── */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <Building className="size-5 text-gray-700" strokeWidth={2.5} />
                                <Typography as="h3" font="text-xl" className="text-gray-900 tracking-tight">Enter Student Details</Typography>
                            </div>


                            <div className="space-y-6 min-w-0">
                                <div className="w-full max-w-sm">
                                    <form.Field name="avatar_url">
                                        {(field) => (
                                            <div className="space-y-2">
                                                <Typography font="small" className="text-gray-900">
                                                    Upload Profile Picture
                                                </Typography>
                                                <ImageUploadCard
                                                    value={field.state.value ?? (defaultData?.avatar_url ?? null)}
                                                    onChange={(file) => field.handleChange((file ?? undefined) as File | undefined)}
                                                    message="passport size picture"
                                                    className="w-full min-h-[180px] max-h-[220px]"
                                                />
                                            </div>
                                        )}
                                    </form.Field>
                                </div>

                                <div className="space-y-4 sm:space-y-6 min-w-0">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 min-w-0">
                                        <form.Field name="title">
                                            {(field) => (
                                                <F field={field} label={mode === "create" ? "Title (Required)" : "Title"}>
                                                    <Select
                                                        value={field.state.value || undefined}
                                                        onValueChange={(v) => {
                                                            field.handleChange(v)
                                                            const mappedGender = genderFromTitle(v)
                                                            if (mappedGender) {
                                                                form.setFieldValue("gender", mappedGender)
                                                            }
                                                        }}
                                                    >
                                                        <SelectTrigger id={field.name} className="h-12 w-full">
                                                            <SelectValue placeholder="Select Title" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Mr">Mr</SelectItem>
                                                            <SelectItem value="Mrs">Mrs</SelectItem>
                                                            <SelectItem value="Ms">Ms</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </F>
                                            )}
                                        </form.Field>

                                        <form.Field name="first_name">
                                            {(field) => (
                                                <F field={field} label="First Name">
                                                    <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Enter first name" className="w-full" />
                                                </F>
                                            )}
                                        </form.Field>

                                        <form.Field name="last_name">
                                            {(field) => (
                                                <F field={field} label="Last Name">
                                                    <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Enter last name" className="w-full" />
                                                </F>
                                            )}
                                        </form.Field>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 min-w-0">
                                        <form.Field name="gender">
                                            {(field) => (
                                                <form.Subscribe selector={(s) => s.values.title}>
                                                    {(title) => {
                                                        const derivedGender =
                                                            genderFromTitle(String(title ?? "")) ??
                                                            (field.state.value as "MALE" | "FEMALE" | undefined)
                                                        return (
                                                            <F field={field} label="Gender">
                                                                <Select
                                                                    value={derivedGender || undefined}
                                                                    disabled
                                                                >
                                                                    <SelectTrigger className="h-12 w-full opacity-100">
                                                                        <SelectValue placeholder="Select title first" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="MALE">Male</SelectItem>
                                                                        <SelectItem value="FEMALE">Female</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </F>
                                                        )
                                                    }}
                                                </form.Subscribe>
                                            )}
                                        </form.Field>

                                        <form.Field name="email">
                                            {(field) => (
                                                <F field={field} label="Email">
                                                    <Input id={field.name} type="email" value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Enter your email" className="w-full" />
                                                </F>
                                            )}
                                        </form.Field>

                                        <form.Field name="phone">
                                            {(field) => (
                                                <F field={field} label="Phone">
                                                    <PhoneInputComponent
                                                        className="w-full"
                                                        value={field.state.value}
                                                        onChange={(value) => field.handleChange(value)}
                                                        placeholder="Enter phone number"
                                                    />
                                                </F>
                                            )}
                                        </form.Field>
                                    </div>
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 min-w-0">
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

                                <form.Field name="street_1">
                                    {(field) => (
                                        <F field={field} label="Street 1">
                                            <Input
                                                id={field.name}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                placeholder="Enter street line 1"
                                            />
                                        </F>
                                    )}
                                </form.Field>

                                <form.Field name="street_2">
                                    {(field) => (
                                        <F field={field} label="Street 2">
                                            <Input
                                                id={field.name}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                placeholder="Enter street line 2 (optional)"
                                            />
                                        </F>
                                    )}
                                </form.Field>

                                <form.Field name="country">
                                    {(field) => (
                                        <F field={field} label="Country">
                                            <CountrySelect
                                                value={field.state.value}
                                                onValueChange={(v) => {
                                                    const previousCountry = field.state.value
                                                    const currentNationality = form.getFieldValue("nationality")
                                                    field.handleChange(v)
                                                    field.handleBlur()
                                                    form.setFieldValue("state", "")
                                                    form.setFieldValue("city", "")
                                                    if (
                                                        !currentNationality ||
                                                        currentNationality === previousCountry
                                                    ) {
                                                        form.setFieldValue("nationality", v)
                                                    }
                                                }}
                                            />
                                        </F>
                                    )}
                                </form.Field>

                                <form.Subscribe selector={(s) => s.values.country}>
                                    {(country) => (
                                        <form.Field name="state">
                                            {(field) => (
                                                <F field={field} label="State">
                                                    <StateSelect
                                                        country={country}
                                                        value={field.state.value}
                                                        onValueChange={(v) => {
                                                            field.handleChange(v)
                                                            field.handleBlur()
                                                            form.setFieldValue("city", "")
                                                        }}
                                                    />
                                                </F>
                                            )}
                                        </form.Field>
                                    )}
                                </form.Subscribe>

                                <form.Subscribe
                                    selector={(s) => ({
                                        country: s.values.country,
                                        state: s.values.state,
                                    })}
                                >
                                    {({ country, state }) => (
                                        <form.Field name="city">
                                            {(field) => (
                                                <F field={field} label="City">
                                                    <CitySelect
                                                        country={country}
                                                        state={state}
                                                        value={field.state.value}
                                                        onValueChange={(v) => {
                                                            field.handleChange(v)
                                                            field.handleBlur()
                                                        }}
                                                    />
                                                </F>
                                            )}
                                        </form.Field>
                                    )}
                                </form.Subscribe>

                                <form.Field name="nationality">
                                    {(field) => (
                                        <F field={field} label="Nationality">
                                            <CountrySelect
                                                id={field.name}
                                                value={field.state.value}
                                                onValueChange={(v) => {
                                                    field.handleChange(v)
                                                    field.handleBlur()
                                                }}
                                                placeholder="Select nationality"
                                            />
                                        </F>
                                    )}
                                </form.Field>

                                <AddressFormFieldGroup
                                    form={form}
                                    isEditing
                                    showHeading={false}
                                    renderField={({ field, label, children }) => (
                                        <F field={field} label={label}>
                                            {children}
                                        </F>
                                    )}
                                />

                                <form.Field name="guardian_phone">
                                    {(field) => (
                                        <F field={field} label="Parent/Guardian Phone">
                                            <PhoneInputComponent
                                                className="w-full"
                                                value={field.state.value}
                                                onChange={(value) => field.handleChange(value)}
                                                placeholder="Enter phone number"
                                            />
                                        </F>
                                    )}
                                </form.Field>

                                <form.Field name="guardian_email">
                                    {(field) => (
                                        <F field={field} label="Parent/Guardian Email">
                                            <Input
                                                id={field.name}
                                                type="email"
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                placeholder="Enter your guardian Email"
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
                                        {field.state.value.map((_item: StudentInput["academic_background"][number], index: number) => (
                                            <form.Subscribe
                                                key={index}
                                                selector={(state) => state.values.academic_background[index]?.grade_type}
                                            >
                                                {(gradeType) => {
                                                    const isGpa = gradeType === "gpa"
                                                    const isPercentage = gradeType === "percentage"

                                                    return (
                                                        <div className="flex flex-col md:flex-row flex-wrap gap-4">
                                                            <form.Field name={`academic_background[${index}].qualification`}>
                                                                {(subField) => (
                                                                    <div className="flex-1 min-w-[200px]">
                                                                        <F field={subField} label="Highest Level of Education">
                                                                            <Select
                                                                                value={subField.state.value || undefined}
                                                                                onValueChange={(v) => {
                                                                                    handleQualificationChange(
                                                                                        subField.state.value,
                                                                                        v,
                                                                                        () => {
                                                                                            subField.handleChange(
                                                                                                v as typeof subField.state.value
                                                                                            )
                                                                                            subField.handleBlur()
                                                                                        }
                                                                                    )
                                                                                }}
                                                                            >
                                                                                <SelectTrigger className="h-12">
                                                                                    <SelectValue placeholder="Select highest level of education" />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    {subField.state.value &&
                                                                                        !isHighestEducationLevel(subField.state.value) && (
                                                                                            <SelectItem
                                                                                                value={subField.state.value}
                                                                                                disabled
                                                                                            >
                                                                                                {getHighestEducationLabel(subField.state.value) ||
                                                                                                    "Previous selection — choose a new level"}
                                                                                            </SelectItem>
                                                                                        )}
                                                                                    {HIGHEST_EDUCATION_OPTIONS.map((option) => (
                                                                                        <SelectItem key={option.value} value={option.value}>
                                                                                            {option.label}
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
                                                                        <F field={subField} label="Grade Type (Optional)">
                                                                            <Select
                                                                                value={subField.state.value || undefined}
                                                                                onValueChange={(v) => {
                                                                                    const nextGradeType = v as GradeType
                                                                                    subField.handleChange(nextGradeType)
                                                                                    subField.handleBlur()
                                                                                    if (nextGradeType === "gpa") {
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
                                                                                    <SelectValue placeholder="Select grade type (optional)" />
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
                                                                            <F field={subField} label="GPA (Optional)">
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
                                                            ) : null}

                                                            {isPercentage ? (
                                                                <>
                                                                    <form.Field name={`academic_background[${index}].obtained_marks`}>
                                                                        {(subField) => (
                                                                            <div className="flex-1 min-w-[140px]">
                                                                                <F field={subField} label="Obtained Marks (Optional)">
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
                                                                                <F field={subField} label="Total Marks (Optional)">
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
                                                            ) : null}
                                                        </div>
                                                    )
                                                }}
                                            </form.Subscribe>
                                        ))}
                                    </div>
                                )}
                            </form.Field>
                        </div>

                        {/* ── Section: Create Application ── */}
                        {mode === "create" && user?.role === Role.AGENT && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2 pb-2">
                                        <ClipboardList className="size-5" strokeWidth={2.5} />
                                        <Typography as="h3" className="font-bold">
                                            Create Application
                                        </Typography>
                                        <Badge variant="outline">Optional</Badge>
                                    </div>
                                    <Typography as="p" className="text-sm text-gray-600">
                                        If you want to apply for a program, you can do it directly from here while creating the student.
                                    </Typography>
                                </div>

                                <form.Subscribe
                                    selector={(state) => state.values.academic_background[0]?.qualification}
                                >
                                    {(highestEducation) => {
                                        const eligibleCourses = highestEducation
                                            ? filterCoursesByHighestEducation(courses, highestEducation)
                                            : [];

                                        return (
                                            <div className="space-y-6">
                                                {!highestEducation || !isHighestEducationLevel(highestEducation) ? (
                                                    <div className="rounded-sm border border-dashed border-gray-200 bg-gray-50/50 px-4 py-6 text-center">
                                                        <Typography as="p" className="text-sm font-medium text-gray-500">
                                                            Select your highest level of education in Academic Background to view available courses.
                                                        </Typography>
                                                    </div>
                                                ) : (
                                                    <CourseSelect
                                                        courses={eligibleCourses}
                                                        selectedCourseIds={selectedCourseIds}
                                                        onChange={handleCourseSelectionChange}
                                                    />
                                                )}

                                                {selectedCourseIds.length > 0 && (
                                                    <div className="space-y-4">
                                                        <Typography as="p" className="text-sm text-gray-600">
                                                            This application is optional. Documents marked as required must be uploaded before submitting.
                                                        </Typography>

                                                        <SupportingDocumentsSection
                                                            documents={documents}
                                                            requiredDocTypes={applicationRequiredDocTypes}
                                                            optionalDocTypes={applicationOptionalDocTypes}
                                                            hasSelectedCourses
                                                            selectedStudentId={createdStudentId || ""}
                                                            refetchDocuments={refetchDocuments}
                                                            isDocumentsLoading={isDocumentsLoading}
                                                            pendingFiles={pendingFiles}
                                                            setPendingFiles={setPendingFiles}
                                                            isUploading={isUploading}
                                                        />

                                                        {applicationDocError && (
                                                            <FieldError errors={[{ message: applicationDocError }]} />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }}
                                </form.Subscribe>
                            </div>
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
                                        {mutation.isPending
                                            ? "Processing..."
                                            : mode === "create" && user?.role === Role.AGENT
                                                ? selectedCourseIds.length > 0
                                                    ? "Create Student & Application"
                                                    : "Create Student"
                                                : mode === "edit"
                                                    ? "Update Student"
                                                    : "Register"}
                                    </Button>
                                )}
                            </form.Subscribe>
                        </div>
                    </FieldGroup>
                </form>
            </div>

            <QualificationUpgradeDialog
                open={qualificationUpgradeNotice.open}
                title={qualificationUpgradeNotice.title}
                description={qualificationUpgradeNotice.description}
                onOpenChange={(open) =>
                    setQualificationUpgradeNotice((current) => ({ ...current, open }))
                }
            />
        </div>

    )
}
