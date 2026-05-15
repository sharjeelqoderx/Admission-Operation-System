"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { useEffect } from "react"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { DocumentFormSchema, type DocumentInput } from "@/types/schemas/document"
import { ErrorView } from "@/components/shared/error-view"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import ImageUploadCard from "@/components/shared/image-upload-card"
import { Plus, ImageIcon } from "lucide-react"
import { Typography } from "@/components/shared/Typography"

function F({ field, label, children }: { field: any; label: string; children: React.ReactNode }) {
    const isSubmitted = field.form.state.isSubmitted
    const isInvalid = isSubmitted && !field.state.meta.isValid
    const error = field.state.meta.errors?.[0]
    const errorMessage = typeof error === "string" ? error : (error as any)?.message
    return (
        <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
            {children}
            {isInvalid && errorMessage && <FieldError errors={[{ message: errorMessage }]} />}
        </Field>
    )
}

export function UploadDocumentForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const studentIdParam = searchParams.get("student_id")
    const queryClient = useQueryClient()

    const { data: studentsData } = useQuery({
        queryKey: ["students"],
        queryFn: async () => {
            const res = await fetch("/api/student")
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error ?? "Failed")
            return json.data as { profile_id: string; student_code: string; profile: { name: string } }[]
        },
    })

    const students = Array.isArray(studentsData) ? studentsData : []

    const mutation = useMutation({
        mutationFn: async (fd: FormData) => {
            const res = await fetch("/api/document", { method: "POST", body: fd })
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error ?? "Something went wrong")
            return json
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["documents"] })
            const from = searchParams.get("from")
            const studentId = form.state.values.student_id
            if (from === "application") {
                router.push(`/dashboard/application/new?student_id=${studentId}`)
            } else {
                router.push("/dashboard/document")
            }
            router.refresh()
        },

    })

    const apiError = mutation.error instanceof Error ? mutation.error.message : ""

    const form = useForm({
        defaultValues: {
            student_id: studentIdParam || "",
            name: "",
            files: [] as File[],
            comment: "",
        } as DocumentInput,

        validators: { onSubmit: DocumentFormSchema, onChange: DocumentFormSchema },

        onSubmit: async ({ value }) => {
            const parsed = DocumentFormSchema.safeParse(value)
            if (!parsed.success) return
            const fd = new FormData()
            fd.set("student_id", parsed.data.student_id)
            fd.set("name", parsed.data.name)
            parsed.data.files.forEach((file) => {
                fd.append("files", file)
            })
            if (parsed.data.comment) fd.set("comment", parsed.data.comment)
            await mutation.mutateAsync(fd)
        },
    })

    useEffect(() => {
        if (studentIdParam) {
            form.setFieldValue("student_id", studentIdParam)
        }
    }, [studentIdParam])

    const handleFileChange = (index: number, file: File | null) => {
        const currentFiles = [...(form.state.values.files || [])]
        if (file) {
            currentFiles[index] = file
        } else {
            currentFiles.splice(index, 1)
        }
        form.setFieldValue("files", currentFiles.filter(Boolean))
    }

    return (
        <div className="relative overflow-hidden">
            <form
                id="document-form"
                onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}
                className="space-y-12 relative z-10"
            >
                <FieldGroup className="p-1">
                    <form.Field name="student_id">
                        {(field) => (
                            <F field={field} label="Select Student">
                                <Select
                                    value={field.state.value}
                                    onValueChange={(v) => field.handleChange(v)}
                                >
                                    <SelectTrigger className="h-12">
                                        <SelectValue placeholder="Select a student" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[100px] overflow-y-auto">
                                        {students.map((s) => (
                                            <SelectItem className="capitalize" key={s.profile_id} value={s.profile_id}>
                                                {s.student_code}
                                                {/* <div className="flex items-center justify-between w-full gap-4">
                                                    <span>{s.profile?.name}</span>
                                                    <span className="text-[10px] font-extrabold text-brand-byzantine bg-brand-byzantine/5 px-2 py-0.5 rounded uppercase">
                                                    </span>
                                                </div> */}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </F>
                        )}
                    </form.Field>

                    <form.Field name="name">
                        {(field) => (
                            <F field={field} label="File Name">
                                <Input
                                    id={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder="Enter file name (e.g. Passport, Degree)"
                                />
                            </F>
                        )}
                    </form.Field>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:col-span-2">
                        <form.Field name="files">
                            {(field) => {
                                const isSubmitted = field.form.state.isSubmitted
                                const firstFile = field.state.value?.[0]
                                const isInvalid = isSubmitted && (!firstFile)

                                return (
                                    <>
                                        <div className="space-y-3">
                                            <Typography font="small" className="text-gray-400 uppercase tracking-widest">
                                                Front Side
                                            </Typography>

                                            <ImageUploadCard
                                                value={firstFile ?? null}
                                                onChange={(file) => handleFileChange(0, file as unknown as File)}
                                                message="Front File"
                                                accept="image/*,application/pdf,.doc,.docx"
                                                className={cn(
                                                    "min-h-[160px] border-2 border-transparent hover:border-brand-byzantine bg-gray-50/50 hover:bg-gray-100/50 transition-all",
                                                    isInvalid && "border-red-300 bg-red-50/30"
                                                )}
                                                emptyIcon={<Plus size={32} className="text-gray-300" />}
                                            />
                                            {isInvalid && (
                                                <Typography font="small" className="text-red-500 mt-1">Front side file is required</Typography>
                                            )}

                                        </div>

                                        <div className={cn("space-y-3 transition-opacity", !firstFile && "opacity-50")}>
                                            <Typography font="small" className="text-gray-400 uppercase tracking-widest">
                                                Back Side (Optional)
                                            </Typography>

                                            <ImageUploadCard
                                                value={field.state.value?.[1] ?? null}
                                                onChange={(file) => firstFile && handleFileChange(1, file as unknown as File)}
                                                message="Back File"
                                                accept="image/*,application/pdf,.doc,.docx"
                                                className={cn(
                                                    "min-h-[160px] border-2 border-dashed border-gray-200 bg-gray-50/50 hover:bg-gray-100/50 hover:border-brand-byzantine/30 transition-all",
                                                    !firstFile && "cursor-not-allowed pointer-events-none"
                                                )}
                                                emptyIcon={<Plus size={32} className="text-gray-300" />}
                                            />
                                            {!firstFile && (
                                                <Typography font="small" className="text-gray-400">Please upload front side first</Typography>
                                            )}

                                        </div>
                                    </>
                                )
                            }}
                        </form.Field>
                    </div>

                    <div className="md:col-span-2">
                        <form.Field name="comment">
                            {(field) => (
                                <F field={field} label="Comment (Optional)">
                                    <Input
                                        id={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        placeholder="Add a comment (optional)"
                                    />
                                </F>
                            )}
                        </form.Field>
                    </div>
                </FieldGroup>
            </form>

            <div className="pt-10">
                <ErrorView message={apiError} />
            </div>

            <div className="mt-12 border-t border-gray-200/40 flex flex-row items-center justify-between gap-4 w-full">
                <Button
                    variant="outline"
                    type="button"
                    onClick={() => router.back()}
                    className="flex-1 h-12 border border-brand-byzantine text-brand-byzantine hover:text-brand-byzantine hover:bg-brand-byzantine/5 rounded-sm font-bold"
                >
                    Cancel
                </Button>

                <form.Subscribe selector={(s) => ({ isSubmitting: s.isSubmitting, values: s.values })}>
                    {({ isSubmitting, values }) => {
                        const canSubmit = !!values.student_id && !!values.name?.trim() && (values.files?.length || 0) >= 1
                        return (
                            <Button
                                type="submit"
                                form="document-form"
                                className="flex-1 h-12 bg-brand-byzantine hover:bg-brand-byzantine/90 text-white rounded-sm text-sm transition-all"
                                disabled={isSubmitting || mutation.isPending || !canSubmit}
                            >
                                {mutation.isPending ? "Uploading..." : "Upload File"}
                            </Button>
                        )
                    }}
                </form.Subscribe>
            </div>
        </div>
    )
}
