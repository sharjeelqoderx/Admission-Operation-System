"use client";

import { useState, useEffect, useMemo, useRef } from "react";

import { Typography } from "@/components/shared/Typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, CheckSquare, Square, FileText, GraduationCap, User2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { FilePreview } from "@/components/shared/FilePreview";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useRouter, useSearchParams } from "next/navigation";

import { DatePicker } from "@/components/shared/date-picker";
import { useForm, useStore } from "@tanstack/react-form";
import { CreateApplicationSchema, type CreateApplicationInput } from "@/types/schemas/application";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { ErrorView } from "@/components/shared/error-view";


type Student = {
    profile: {
        id: string;
        name: string;
    };
    student_code: string;
    avatar_url?: string;
    name?: string;
    email?: string;
    date_of_birth?: string;
    gender?: string;
    id?: string;
    student?: {
        nationality?: string;
    };
};

type Program = {
    program_id: string;
    university_id: string;
    university_name?: string;
    name: string;
    tuition_fee: string;
    currency?: string;
    intake_date?: string;
    deadline?: string;
    status?: string;
};

type Document = {
    id: string;
    name: string;
    document_type_id: string;
    document_type?: { id: string; name: string };
    created_at: string;
    document_files?: { file_url: string }[];
};


function F({ field, label, isStepAttempted, children }: { field: any; label: string; isStepAttempted?: boolean; children: React.ReactNode }) {
    const isSubmitted = field.form.state.isSubmitted || isStepAttempted;
    const isInvalid = isSubmitted && !field.state.meta.isValid;
    const error = field.state.meta.errors?.[0];
    const errorMessage = typeof error === "string" ? error : (error as any)?.message;

    return (
        <Field data-invalid={isInvalid} className="w-full">
            {label && <FieldLabel className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">{label}</FieldLabel>}
            {children}
            {isInvalid && errorMessage && <FieldError errors={[{ message: errorMessage }]} />}
        </Field>
    );
}

export function CreateApplicationForm() {
    const [step, setStep] = useState(1);
    const [isStep1Attempted, setIsStep1Attempted] = useState(false);
    const [isStep2Attempted, setIsStep2Attempted] = useState(false);
    const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
    const [duplicateError, setDuplicateError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const studentIdParam = searchParams.get("student_id");
    const programIdParam = searchParams.get("program_id");
    const stepParam = searchParams.get("step");
    const uploadedParam = searchParams.get("uploaded");



    const { data: user } = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const res = await fetch("/api/me");
            if (!res.ok) throw new Error("Failed to fetch profile");
            const json = await res.json();
            return json.data;
        },
    });

    const { data: studentsResponse } = useQuery({
        queryKey: ["students"],
        queryFn: async () => {
            const res = await fetch("/api/student");
            if (!res.ok) throw new Error("Failed to fetch students");
            return res.json();
        }
    });
    const students: Student[] = Array.isArray(studentsResponse?.data) ? studentsResponse.data : [];

    const createApplication = useMutation({
        mutationFn: async (value: CreateApplicationInput) => {
            const res = await fetch("/api/application", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(value)
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to create application");
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success("Application created successfully");
            router.push("/dashboard/application");
        },
        onError: (err: Error) => {
            toast.error(err.message);
        }
    });

    const form = useForm({
        defaultValues: {
            profile_id: studentIdParam || "",
            program_id: programIdParam || "",
            university_id: "",

            document_ids: [] as string[],
            intake_date: "",
            declarations: [false, false, false]
        } as CreateApplicationInput,
        validators: {
            onChange: CreateApplicationSchema,
        },
        onSubmit: async ({ value }) => {
            await createApplication.mutateAsync(value);
        }
    });

    useEffect(() => {
        if (user?.role === "STUDENT") {
            form.setFieldValue("profile_id", user.id);
        } else if (studentIdParam) {
            form.setFieldValue("profile_id", studentIdParam);
        }
    }, [user, studentIdParam, form]);

    const selectedStudentId = useStore(form.store, (s: any) => s.values.profile_id);
    const selectedProgramId = useStore(form.store, (s: any) => s.values.program_id) || programIdParam || "";

    const { data: studentDetailsResponse } = useQuery({
        queryKey: ["student", selectedStudentId],
        queryFn: async () => {
            if (!selectedStudentId) return null;
            const res = await fetch(`/api/student/${selectedStudentId}`);
            if (!res.ok) throw new Error("Failed to fetch student details");
            return res.json();
        },
        enabled: !!selectedStudentId
    });
    const studentDetails: Student | undefined = studentDetailsResponse?.data;

    const { data: documentsResponse, isLoading: isDocumentsLoading, refetch: refetchDocuments } = useQuery({
        queryKey: ["student-documents", selectedStudentId, selectedProgramId],
        queryFn: async () => {
            if (!selectedStudentId) return null;
            const params = new URLSearchParams();
            if (selectedProgramId) params.set("program_id", selectedProgramId);
            const res = await fetch(`/api/document/student/${selectedStudentId}?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch documents");
            return res.json();
        },
        enabled: !!selectedStudentId,
        staleTime: 0,
        refetchOnMount: "always",
    });
    const documents: Document[] = Array.isArray(documentsResponse?.data) ? documentsResponse.data : [];

    useEffect(() => {
        if (stepParam === "2" && (studentIdParam || selectedStudentId) && (programIdParam || selectedProgramId)) {
            setStep(2);
        }
    }, [stepParam, studentIdParam, programIdParam, selectedStudentId, selectedProgramId]);

    useEffect(() => {
        if (uploadedParam !== "1" || !selectedStudentId) return;
        queryClient.invalidateQueries({
            queryKey: ["student-documents", selectedStudentId],
            exact: false,
        });
        refetchDocuments();
        const params = new URLSearchParams(searchParams.toString());
        params.delete("uploaded");
        router.replace(`/dashboard/application/new?${params.toString()}`, { scroll: false });
    }, [uploadedParam, selectedStudentId, queryClient, refetchDocuments, searchParams, router]);

    const { data: programsResponse } = useQuery({
        queryKey: ["programs"],
        queryFn: async () => {
            const res = await fetch("/api/program?limit=50");
            if (!res.ok) throw new Error("Failed to fetch programs");
            return res.json();
        }
    });
    const programs: Program[] = Array.isArray(programsResponse?.data) ? programsResponse.data : [];

    const { data: programDetailResponse } = useQuery({
        queryKey: ["program-detail", selectedProgramId],
        queryFn: async () => {
            const res = await fetch(`/api/program/${selectedProgramId}`);
            if (!res.ok) throw new Error("Failed to fetch program details");
            return res.json();
        },
        enabled: !!selectedProgramId,
    });

    const requiredDocTypes: { id: string; name: string }[] = useMemo(() => {
        const fromProgram = (
            programDetailResponse?.data?.program_document_requirements ?? []
        )
            .map((r: { document_type?: { id: string; name: string } }) => r.document_type)
            .filter((t: { id: string; name: string } | undefined): t is { id: string; name: string } => Boolean(t?.id));

        if (fromProgram.length > 0) return fromProgram;

        // No program requirements configured — show types from student's uploaded documents
        const seen = new Set<string>();
        return documents.reduce<{ id: string; name: string }[]>((acc, d) => {
            const typeId = d.document_type?.id ?? d.document_type_id;
            const typeName = d.document_type?.name ?? "Document";
            if (typeId && !seen.has(typeId)) {
                seen.add(typeId);
                acc.push({ id: typeId, name: typeName });
            }
            return acc;
        }, []);
    }, [programDetailResponse, documents]);

    useEffect(() => {
        if (programIdParam && programsResponse?.data) {
            const programs: Program[] = programsResponse.data;
            const program = programs.find(p => p.program_id === programIdParam);
            if (program) {
                form.setFieldValue("program_id", program.program_id);
                form.setFieldValue("university_id", program.university_id);
                form.setFieldValue("intake_date", program.intake_date || "N/A");
            }
        }
    }, [programIdParam, programsResponse, form]);

    const prevProgramRef = useRef<string>("");
    useEffect(() => {
        if (prevProgramRef.current && prevProgramRef.current !== selectedProgramId) {
            form.setFieldValue("document_ids", []);
        }
        prevProgramRef.current = selectedProgramId;
    }, [selectedProgramId, form]);

    // Auto-select documents for required types that are not yet selected (e.g. after upload)
    useEffect(() => {
        if (!selectedProgramId || documents.length === 0) return;

        const currentIds = form.getFieldValue("document_ids") as string[];
        const selectedDocs = documents.filter((d) => currentIds.includes(d.id));
        const selectedTypeIds = new Set(
            selectedDocs.map((d) => d.document_type?.id ?? d.document_type_id)
        );

        const typesToMatch =
            requiredDocTypes.length > 0
                ? requiredDocTypes
                : documents
                      .map((d) => ({
                          id: d.document_type?.id ?? d.document_type_id,
                      }))
                      .filter((t): t is { id: string } => Boolean(t.id));

        const toAdd = typesToMatch
            .filter((t) => !selectedTypeIds.has(t.id))
            .map((t) =>
                documents.find(
                    (d) => (d.document_type?.id ?? d.document_type_id) === t.id
                )?.id
            )
            .filter((id): id is string => Boolean(id));

        if (toAdd.length > 0) {
            form.setFieldValue("document_ids", [...currentIds, ...toAdd]);
        }
    }, [selectedProgramId, requiredDocTypes, documents, form]);


    const handleNextStep = async () => {
        if (step === 1) {
            setIsStep1Attempted(true);
            const studentId = form.getFieldValue("profile_id");

            if (!studentId) {
                return;
            }

            setStep(2);
        } else if (step === 2) {
            setIsStep2Attempted(true);
            const programId = form.getFieldValue("program_id");
            const studentId = form.getFieldValue("profile_id");
            const documentIds = form.getFieldValue("document_ids");

            if (!programId) {
                toast.error("Please select a program first.");
                return;
            }

            if (!documentIds || documentIds.length === 0) {
                toast.error("Please select at least one supporting document.");
                return;
            }

            // Validate required document types
            if (requiredDocTypes.length > 0) {
                const studentDocTypeIds = documents
                    .filter(d => documentIds.includes(d.id))
                    .map((d) => d.document_type?.id ?? d.document_type_id);
                const missingTypes = requiredDocTypes.filter(rt => !studentDocTypeIds.includes(rt.id));
                if (missingTypes.length > 0) {
                    toast.error(`Missing required documents: ${missingTypes.map(m => m.name).join(", ")}`);
                    return;
                }
            }

            // Check for existing application
            try {
                setIsCheckingDuplicate(true);
                setDuplicateError(null);
                const res = await fetch(`/api/application?student_id=${studentId}`);
                if (res.ok) {
                    const json = await res.json();
                    const existing = (json.data || []).find((app: any) => 
                        app.program?.id === programId && app.status !== "REJECTED"
                    );
                    if (existing) {
                        setDuplicateError("Application is already created for this program");
                        toast.error("Application is already created for this program");
                        setIsCheckingDuplicate(false);
                        return;
                    }
                }
                setIsCheckingDuplicate(false);
            } catch (err) {
                console.error("Failed to check existing applications", err);
                setIsCheckingDuplicate(false);
            }

            setStep(3);
        }
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="space-y-2">
                <Typography as="h2" font="sub-heading" className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {step === 1 ? "Create Application" : "Choose Your Path"}
                </Typography>
                <Typography as="p" font="sub-text" className="text-gray-500 font-medium leading-relaxed">
                    {step === 1
                        ? "Initiate a new student application and link them to global academic programs.\nEnsure all mandatory fields are verified before submission."
                        : "Select the academic program that aligns with your professional aspirations. Browse\nour curated selection of undergraduate and graduate degrees."}
                </Typography>
            </div>

            <div className="flex items-center justify-between relative pt-4 pb-8">
                <div className="absolute top-8 left-0 right-0 h-0.5 bg-gray-200 -z-10" />
                <div
                    className="absolute top-8 left-0 h-0.5 bg-brand-secondary -z-10 transition-all duration-300"
                    style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
                />

                <div className="flex flex-col items-center gap-3">
                    <div className={cn(
                        "size-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                        step >= 1 ? "bg-brand-secondary text-white" : "bg-[#e2e8f0] text-gray-500"
                    )}>
                        1
                    </div>
                    <span className="text-[10px] font-bold tracking-widest text-brand-secondary uppercase">Student Profile</span>
                </div>

                <div className="flex flex-col items-center gap-3">
                    <div className={cn(
                        "size-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                        step >= 2 ? "bg-brand-secondary text-white" : "bg-[#e2e8f0] text-gray-500"
                    )}>
                        2
                    </div>
                    <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Program Selection</span>
                </div>

                <div className="flex flex-col items-center gap-3">
                    <div className={cn(
                        "size-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                        step >= 3 ? "bg-brand-secondary text-white" : "bg-[#e2e8f0] text-gray-500"
                    )}>
                        3
                    </div>
                    <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Review & Submit</span>
                </div>
            </div>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
            >
                {step === 1 && (
                    <Step1
                        form={form}
                        students={students}
                        studentDetails={studentDetails}
                        role={user?.role}
                        isStepAttempted={isStep1Attempted}
                        onNext={handleNextStep}
                    />
                )}
                {step === 2 && (
                    <Step2
                        form={form}
                        programs={programs}
                        studentDetails={studentDetails}
                        documents={documents}
                        requiredDocTypes={requiredDocTypes}
                        selectedProgramId={selectedProgramId}
                        isDocumentsLoading={isDocumentsLoading}
                        onNext={handleNextStep}
                        onBack={() => setStep(1)}
                        isChecking={isCheckingDuplicate}
                        isStepAttempted={isStep2Attempted}
                        error={duplicateError}
                    />
                )}
                {step === 3 && (
                    <Step3
                        form={form}
                        studentDetails={studentDetails}
                        allDocuments={documents}
                        programs={programs}
                        onBack={() => setStep(2)}
                        isSubmitting={createApplication.isPending}
                        error={createApplication.error?.message}
                    />
                )}


            </form>
        </div>
    );
}

function Step1({ form, students, studentDetails, role, isStepAttempted, onNext }: { form: any; students: Student[]; studentDetails?: Student; role?: string; isStepAttempted?: boolean; onNext: () => void }) {
    return (
        <div className="space-y-8">
            <div className="space-y-2">
                {role !== "STUDENT" && (
                    <form.Field name="profile_id">
                        {(field: any) => (
                            <F field={field} label="Select Student" isStepAttempted={isStepAttempted}>
                                <Select value={field.state.value} onValueChange={field.handleChange}>
                                    <SelectTrigger className="w-full h-12 bg-white/40 backdrop-blur-md rounded-xl border border-white/60 shadow-sm focus:ring-brand-byzantine/20">
                                        <SelectValue placeholder="Select a student..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white/90 backdrop-blur-xl border-white/60 rounded-xl shadow-2xl">
                                        {students.map((s) => (
                                            <SelectItem key={s.profile.id} value={s.profile.id} className="focus:bg-brand-byzantine/10 focus:text-brand-byzantine cursor-pointer py-3">
                                                {s.student_code}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </F>
                        )}
                    </form.Field>
                )}
            </div>

            <div className="space-y-4">
                <Typography as="h3" font="title" className="text-brand-secondary">Personal Information</Typography>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Full Name</label>
                        <div className="bg-white/40 backdrop-blur-md rounded-xl border border-white/60 shadow-sm">
                            <Input value={studentDetails?.name || ""} disabled placeholder="e.g. Elena Rodriguez" className="border-0 bg-transparent h-11 text-sm disabled:opacity-70" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
                        <div className="bg-white/40 backdrop-blur-md rounded-xl border border-white/60 shadow-sm">
                            <Input value={studentDetails?.email || ""} disabled placeholder="student@example.com" className="border-0 bg-transparent h-11 text-sm disabled:opacity-70" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Nationality</label>
                        <div className="bg-white/40 backdrop-blur-md rounded-xl border border-white/60 shadow-sm">
                            <Input value={studentDetails?.student?.nationality || ""} disabled placeholder="Nationality" className="border-0 bg-transparent h-11 text-sm disabled:opacity-70" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date of Birth</label>
                        <div className="bg-white/40 backdrop-blur-md rounded-xl border border-white/60 shadow-sm">
                            <Input type="date" value={studentDetails?.date_of_birth || ""} disabled className="border-0 bg-transparent h-11 text-sm disabled:opacity-70" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-gray-200/50">
                <Button type="button" onClick={onNext} className="h-12 px-8 bg-brand-secondary hover:bg-brand-secondary/90 text-white font-bold rounded-xl shadow-lg">Next Step: Program Selection</Button>
            </div>
        </div>
    );
}

function SupportingDocumentsSection({
    form,
    documents,
    requiredDocTypes,
    selectedProgramId,
    isDocumentsLoading,
    isStepAttempted,
}: {
    form: any;
    documents: Document[];
    requiredDocTypes: { id: string; name: string }[];
    selectedProgramId: string;
    isDocumentsLoading?: boolean;
    isStepAttempted?: boolean;
}) {
    if (!selectedProgramId) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <FileText className="size-5 text-blue-600" />
                    <Typography as="h3" font="title" className="text-brand-secondary">Supporting Documents</Typography>
                </div>
                <div className="py-10 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    <Typography as="p" className="text-sm font-medium text-gray-500">
                        Select a program above to view required supporting documents.
                    </Typography>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl p-6 space-y-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileText className="size-5 text-blue-600" />
                    <Typography as="h3" font="title" className="text-brand-secondary">Supporting Documents</Typography>
                </div>
            </div>

            <form.Field name="document_ids">
                {(field: any) => (
                    <div className="space-y-2">
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
                                    const isChecked = doc ? field.state.value?.includes(doc.id) : false;
                                    if (doc) {
                                        return (
                                            <div
                                                key={rt.id}
                                                onClick={() => {
                                                    const current = field.state.value || [];
                                                    const next = current.includes(doc.id)
                                                        ? current.filter((id: string) => id !== doc.id)
                                                        : [...current, doc.id];
                                                    field.handleChange(next);
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
                                    return (
                                        <Link
                                            key={rt.id}
                                            href={`/dashboard/document/new?document_type_id=${rt.id}&student_id=${form.getFieldValue("profile_id")}&program_id=${selectedProgramId}&from=application`}
                                            className="bg-red-50/50 rounded-xl p-3 space-y-3 relative border-2 border-dashed border-red-200 flex flex-col items-center justify-center gap-2 min-h-[140px] hover:bg-red-50 hover:border-red-300 transition-all group"
                                        >
                                            <div className="size-10 rounded-full bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                                                <FileText className="size-5 text-red-400" />
                                            </div>
                                            <div className="text-center">
                                                <Typography as="p" className="text-[11px] font-bold text-red-600 truncate">{rt.name}</Typography>
                                                <Typography as="p" className="text-[9px] text-red-400 mt-0.5">Click to upload</Typography>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : documents.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {documents.map((doc) => {
                                    const isChecked = field.state.value?.includes(doc.id);
                                    const label = doc.document_type?.name ?? "Document";
                                    return (
                                        <div
                                            key={doc.id}
                                            onClick={() => {
                                                const current = field.state.value || [];
                                                const next = current.includes(doc.id)
                                                    ? current.filter((id: string) => id !== doc.id)
                                                    : [...current, doc.id];
                                                field.handleChange(next);
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
                                <Link href={`/dashboard/document/new?student_id=${form.getFieldValue("profile_id")}&program_id=${selectedProgramId}&from=application`}>
                                    <Button type="button" variant="outline" className="text-xs font-bold">Upload Document</Button>
                                </Link>
                            </div>
                        )}
                        {isStepAttempted && (!field.state.value || field.state.value.length === 0) && (
                            <p className="text-[10px] text-red-500 font-medium mt-2">Please select at least one document</p>
                        )}
                    </div>
                )}
            </form.Field>
        </div>
    );
}

function Step2({ form, programs, studentDetails, documents, requiredDocTypes, selectedProgramId, isDocumentsLoading, isChecking, error, isStepAttempted, onNext, onBack }: { form: any; programs: Program[]; studentDetails?: Student; documents: Document[]; requiredDocTypes: { id: string; name: string }[]; selectedProgramId: string; isDocumentsLoading?: boolean; isChecking?: boolean; error?: string | null; isStepAttempted?: boolean; onNext: () => void; onBack: () => void }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [maxFees, setMaxFees] = useState("");
    const [submissionDate, setSubmissionDate] = useState("");

    const filteredPrograms = programs.filter((p) => {
        const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || (statusFilter === "available");
        const matchesFees = !maxFees || parseFloat(p.tuition_fee) <= parseFloat(maxFees);
        const matchesDate = !submissionDate || (p.deadline && new Date(p.deadline) >= new Date(submissionDate));
        return matchesSearch && matchesStatus && matchesFees && matchesDate;
    });

    return (
        <div className="space-y-6">
            {error && (
                <div className="mb-6">
                    <ErrorView
                        message={error}
                    />
                </div>
            )}
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl p-6 space-y-4 shadow-sm">
                    <div className="flex flex-col gap-4">
                        {/* Search - Full Width */}
                        <div className="relative bg-white rounded-xl shadow-sm border border-gray-200 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                            <Input
                                placeholder="Search programs by name or keywords..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border-0 bg-transparent h-11 pl-10 text-xs focus-visible:ring-0 w-full"
                            />
                        </div>

                        <div className="flex flex-wrap gap-4">
                            {/* Status Select */}
                            <div className="flex-1 min-w-[200px]">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="h-11 bg-white border-gray-200 rounded-xl text-xs">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Programs</SelectItem>
                                        <SelectItem value="available">Available</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Max Fees */}
                            <div className="flex-1 min-w-[200px] relative bg-white rounded-xl shadow-sm border border-gray-200">
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="Max Fees (e.g. 5000)"
                                    value={maxFees}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === "" || /^\d+$/.test(val)) {
                                            setMaxFees(val);
                                        }
                                    }}
                                    className="border-0 bg-transparent h-11 text-xs focus-visible:ring-0"
                                />
                            </div>

                            {/* Submission Date */}
                            <div className="flex-1 min-w-[200px] relative bg-white rounded-xl shadow-sm border border-gray-200">
                                <DatePicker
                                    value={submissionDate}
                                    onChange={setSubmissionDate}
                                    placeholder="Last submission date"
                                    className="border-0 bg-transparent h-11 text-xs focus-visible:ring-0 shadow-none hover:bg-transparent"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-80 bg-black/5 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                    <Typography as="h3" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Selected Student</Typography>
                    <div className="flex gap-4">
                        <div className="size-16 rounded-2xl bg-orange-500 border-2 border-white shadow-md overflow-hidden shrink-0">
                            {studentDetails?.avatar_url ? (
                                <img src={studentDetails.avatar_url} alt={studentDetails.name} className="w-full h-full object-cover" />
                            ) : (
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${studentDetails?.name}`} alt={studentDetails?.name} className="w-full h-full object-cover" />
                            )}
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="grid grid-cols-2 gap-1 text-[10px]">
                                <span className="text-gray-500">Nationality</span>
                                <span className="font-bold text-brand-secondary">{studentDetails?.student?.nationality || "-"}</span>
                                <span className="text-gray-500 mt-1">Gender</span>
                                <span className="font-bold text-brand-secondary mt-1 leading-tight">{studentDetails?.gender || "-"}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4">
                        <Typography as="h4" className="text-[16px] font-bold text-brand-secondary">{studentDetails?.name}</Typography>
                        <Typography as="p" className="text-[11px] text-gray-500 font-bold mt-0.5">ID: {studentDetails?.id?.slice(0, 8)}</Typography>
                    </div>
                </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl border border-white/30 rounded-[24px] overflow-hidden shadow-sm">
                <form.Field name="program_id">
                    {(field: any) => (
                        <Table>
                            <TableHeader className="bg-white/30">
                                <TableRow className="hover:bg-transparent border-b-white/20">
                                    <TableHead className="px-8 py-5 text-[10px] font-bold tracking-widest text-gray-500 uppercase">Program</TableHead>
                                    <TableHead className="px-8 py-5 text-[10px] font-bold tracking-widest text-gray-500 uppercase">Semester Fees</TableHead>
                                    <TableHead className="px-8 py-5 text-[10px] font-bold tracking-widest text-gray-500 uppercase">Status</TableHead>
                                    <TableHead className="px-8 py-5 text-[10px] font-bold tracking-widest text-gray-500 uppercase">Deadline</TableHead>
                                    <TableHead className="px-8 py-5 text-[10px] font-bold tracking-widest text-gray-500 uppercase">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPrograms.length > 0 ? (
                                    filteredPrograms.map((p, i) => {
                                        const isSelected = field.state.value === p.program_id;
                                        return (
                                            <TableRow key={i} className="hover:bg-white/20 transition-colors border-b-white/10">
                                                <TableCell className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                        <Typography as="span" className="text-[13px] font-bold text-gray-900 leading-snug">{p.name}</Typography>
                                                        <Typography as="span" className="text-[10px] text-gray-500 font-medium mt-0.5">{p.intake_date || "N/A"} Intake</Typography>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-8 py-6">
                                                    <Typography as="span" className="text-[13px] font-bold text-gray-700">{p.currency || "€"}{p.tuition_fee}</Typography>
                                                </TableCell>
                                                <TableCell className="px-8 py-6">
                                                    <div className={cn(
                                                        "inline-flex items-center h-7 px-4 rounded-full text-[9px] font-bold tracking-widest uppercase",
                                                        p.status?.toLowerCase() === "available" || !p.status ? "bg-blue-500 text-white" : "bg-green-500 text-white"
                                                    )}>
                                                        {p.status || "AVAILABLE"}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-8 py-6">
                                                    <Typography as="span" className="text-[12px] font-medium text-gray-600">{p.deadline ? new Date(p.deadline).toLocaleDateString() : "N/A"}</Typography>
                                                </TableCell>
                                                <TableCell className="px-8 py-6">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => {
                                                            field.handleChange(p.program_id);
                                                            form.setFieldValue("university_id", p.university_id);
                                                            form.setFieldValue("intake_date", p.intake_date || "N/A");
                                                            form.setFieldValue("tuition_fee", p.tuition_fee);
                                                            form.setFieldValue("currency", p.currency || "€");
                                                        }}
                                                        className={cn(
                                                            "h-8 px-5 rounded-lg font-bold text-[11px] transition-all shadow-sm",
                                                            isSelected ? "bg-brand-secondary hover:bg-brand-secondary text-white hover:text-white" : "bg-white/40 border-white/60 text-brand-secondary hover:bg-white/60"
                                                        )}
                                                    >
                                                        {isSelected ? "Selected" : "Select"}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Search className="size-8 text-gray-300" />
                                                <Typography as="p" className="text-sm font-medium text-gray-500">
                                                    No programs found matching your filters.
                                                </Typography>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </form.Field>
                {isStepAttempted && !form.getFieldValue("program_id") && (
                    <p className="text-[10px] text-red-500 font-bold mt-2 text-right uppercase tracking-widest">Please select a program to continue</p>
                )}
            </div>

            <SupportingDocumentsSection
                form={form}
                documents={documents}
                requiredDocTypes={requiredDocTypes}
                selectedProgramId={selectedProgramId}
                isDocumentsLoading={isDocumentsLoading}
                isStepAttempted={isStepAttempted}
            />

            <div className="flex justify-between items-center pt-8 border-t border-gray-200/50">
                <Button type="button" variant="outline" onClick={onBack} className="h-12 px-8 border-gray-300 text-brand-secondary font-bold rounded-xl">Back to Profile</Button>
                <Button
                    type="button"
                    onClick={onNext}
                    disabled={isChecking}
                    className="h-12 px-8 bg-brand-secondary hover:bg-brand-secondary/90 text-white font-bold rounded-xl shadow-lg flex items-center gap-2"
                >
                    {isChecking ? (
                        <>
                            <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Checking...
                        </>
                    ) : (
                        "Next Step: Review & Submit"
                    )}
                </Button>
            </div>
        </div>
    );
}

function Step3({ form, studentDetails, allDocuments, programs, onBack, isSubmitting, error }: { form: any; studentDetails?: Student; allDocuments: Document[]; programs: Program[]; onBack: () => void; isSubmitting: boolean; error?: string }) {


    const selectedProgramId = useStore(form.store, (s: any) => s.values.program_id);
    const selectedDocIds = useStore(form.store, (s: any) => s.values.document_ids) || [];
    const declarations = useStore(form.store, (s: any) => s.values.declarations);
    const selectedProgram = programs.find((p) => p.program_id === selectedProgramId);

    const selectedDocs = allDocuments.filter(doc => selectedDocIds.includes(doc.id));


    const isAllChecked = Array.isArray(declarations) && declarations.every(Boolean);

    const availableIntakes = programs
        .filter((prog) => prog.program_id === selectedProgramId)
        .map((prog) => prog.intake_date)
        .filter(Boolean);
    const uniqueIntakes = Array.from(new Set(availableIntakes)) as string[];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-6">
                        <GraduationCap className="size-5 text-brand-secondary" />
                        <Typography as="h3" font="title" className="text-brand-secondary font-bold">Selected Program Details</Typography>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between gap-6">
                        <div className="space-y-1">
                            <Typography as="h4" font="text-lg" className="font-extrabold text-gray-900 leading-tight">{selectedProgram?.name}</Typography>
                            <Typography as="p" font="small" className="text-gray-500">{selectedProgram?.university_name}</Typography>
                        </div>
                        <div className="space-y-1.5 w-full sm:w-64">
                            <form.Field name="intake_date">
                                {(field: any) => (
                                    <F field={field} label="Academic Session">
                                        <Select value={field.state.value} onValueChange={field.handleChange}>
                                            <SelectTrigger className="h-11 bg-[#f8f9fc] border-gray-200 rounded-xl font-bold">
                                                <SelectValue placeholder="Select Session" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {uniqueIntakes.map((date) => (
                                                    <SelectItem key={date} value={date} className="font-medium">
                                                        {new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                    </SelectItem>
                                                ))}
                                                {uniqueIntakes.length === 0 && (
                                                    <SelectItem value={field.state.value || "N/A"}>
                                                        {field.state.value}
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </F>
                                )}
                            </form.Field>
                        </div>
                    </div>
                </div>

                <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl p-6 shadow-sm">
                    <div className="text-brand-secondary flex items-center gap-2 mb-5">
                        <User size={24} />
                        <Typography as="h3" font="title" className="font-bold">Student Info</Typography>
                    </div>

                    <div className="space-y-4">
                        <div className="overflow-hidden">
                            <Typography as="p" font="small" className="text-gray-400 uppercase tracking-widest">Full Name</Typography>
                            <Typography as="p" font="title" className="text-gray-900 mt-0.5 truncate">{studentDetails?.name}</Typography>
                        </div>
                        <div className="overflow-hidden">
                            <Typography as="p" font="small" className="text-gray-400 uppercase tracking-widest">Email Address</Typography>
                            <Typography as="p" font="title" className="text-gray-900 mt-0.5 truncate">{studentDetails?.email}</Typography>
                        </div>

                        <div>
                            <Typography as="p" font="small" className="text-gray-400 uppercase tracking-widest">Nationality</Typography>
                            <Typography as="p" font="title" className="text-gray-900 mt-0.5">{studentDetails?.student?.nationality || "-"}</Typography>
                        </div>

                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-6 text-brand-secondary">
                    <FileText className="size-5" />
                    <Typography as="h3" font="title" className="font-bold">Attached Documents ({selectedDocs.length})</Typography>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {selectedDocs.map((doc) => (
                        <div key={doc.id} className="space-y-2">
                            <div className="aspect-square bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                                {doc.document_files?.[0]?.file_url ? (
                                    <FilePreview
                                        url={doc.document_files[0].file_url}
                                        name={doc.document_type?.name ?? ""}
                                        showActions={false}
                                        className="border-none shadow-none size-full"
                                    />
                                ) : (
                                    <div className="size-full flex items-center justify-center bg-gray-50">
                                        <FileText className="size-8 text-gray-300" />
                                    </div>
                                )}
                            </div>
                            <Typography as="p" className="text-[10px] font-bold text-gray-700 truncate px-1">
                                {doc.document_type?.name ?? "—"}
                            </Typography>
                        </div>
                    ))}
                    {selectedDocs.length === 0 && (
                        <div className="col-span-full py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <Typography className="text-sm text-gray-400 italic">No documents attached</Typography>
                        </div>
                    )}
                </div>
            </div>


            <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <div className="size-6 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <CheckSquare className="size-3.5 text-blue-600" />
                    </div>
                    <Typography as="h3" font="title" className="text-brand-secondary">Final Declarations</Typography>
                </div>


                <form.Field name="declarations">
                    {(field: any) => (
                        <div className="space-y-4">
                            {[
                                "I confirm that all information provided in this application is true, complete, and accurate to the best of my knowledge. I understand that misrepresentation may lead to rejection.",
                                "I authorize Academic Portal to verify my academic credentials and contact the listed references for the purposes of this application.",
                                "I have read and agree to the Institutional Data Privacy Policy and Terms of Enrollment."
                            ].map((text, i) => {
                                const isChecked = field.state.value?.[i];
                                return (
                                    <div
                                        key={i}
                                        className="flex gap-3 items-start cursor-pointer group"
                                        onClick={() => {
                                            const current = [...(field.state.value || [false, false, false])];
                                            current[i] = !current[i];
                                            field.handleChange(current);
                                        }}
                                    >
                                        <div className="mt-0.5 shrink-0">
                                            <div className={cn(
                                                "size-4 rounded border shadow-sm flex items-center justify-center transition-colors",
                                                isChecked ? "bg-blue-500 border-blue-500" : "bg-white border-gray-300 group-hover:border-blue-400"
                                            )}>
                                                {isChecked && <svg className="size-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                        </div>
                                        <Typography as="p" className="text-[12px] text-gray-600 leading-relaxed pt-0.5 select-none">{text}</Typography>
                                    </div>
                                );
                            })}
                            {field.state.meta.errors?.[0] && (
                                <p className="text-[10px] text-red-500 font-medium">
                                    {typeof field.state.meta.errors[0] === "string"
                                        ? field.state.meta.errors[0]
                                        : (field.state.meta.errors[0] as any)?.message}
                                </p>
                            )}
                        </div>
                    )}
                </form.Field>
            </div>

            {error && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <ErrorView message={error} />
                </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 pt-4">

                <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                    className="h-12 px-8 border-gray-300 text-brand-secondary font-bold rounded-xl w-full sm:w-auto"
                    disabled={isSubmitting}
                >
                    Back to Selection
                </Button>
                <Button
                    type="submit"
                    className={cn(
                        "h-12 px-10",
                        (isSubmitting || !isAllChecked) && "opacity-50 cursor-not-allowed grayscale-[0.5]"
                    )}
                    disabled={isSubmitting || !isAllChecked}
                >
                    {isSubmitting ? "Submitting Application..." : "Send Your Application"}
                </Button>
            </div>
        </div>
    );
}
