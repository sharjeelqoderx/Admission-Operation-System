"use client"

import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { DocumentFormSchema, type DocumentInput } from "@/types/schemas/document"
import { ErrorView } from "@/components/shared/error-view"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ImageUploadCard from "@/components/shared/image-upload-card"
import { Plus } from "lucide-react"

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
    const queryClient = useQueryClient()

    const { data: studentsData } = useQuery({
        queryKey: ["students"],
        queryFn: async () => {
            const res = await fetch("/api/student")
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error ?? "Failed")
            return json.data as { profile_id: string; profile: { name: string } }[]
        },
    })

    const students = studentsData ?? []

    const mutation = useMutation({
        mutationFn: async (fd: FormData) => {
            const res = await fetch("/api/document", { method: "POST", body: fd })
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error ?? "Something went wrong")
            return json
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["documents"] })
            router.push("/dashboard/document")
            router.refresh()
        },
    })

    const apiError = mutation.error instanceof Error ? mutation.error.message : ""

    const form = useForm({
        defaultValues: {
            student_id: "",
            name: "",
            file: undefined as File | undefined,
            comment: "",
        } as DocumentInput,

        validators: { onSubmit: DocumentFormSchema, onChange: DocumentFormSchema },

        onSubmit: async ({ value }) => {
            const parsed = DocumentFormSchema.safeParse(value)
            if (!parsed.success) return
            const fd = new FormData()
            fd.set("student_id", parsed.data.student_id)
            fd.set("name", parsed.data.name)
            fd.set("file", parsed.data.file)
            if (parsed.data.comment) fd.set("comment", parsed.data.comment)
            await mutation.mutateAsync(fd)
        },
    })

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
                                    <SelectContent>
                                        {students.map((s) => (
                                            <SelectItem className="capitalize" key={s.profile_id} value={s.profile_id}>
                                                {s.profile?.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </F>
                        )}
                    </form.Field>

                    <form.Field name="name">
                        {(field) => (
                            <F field={field} label="Document Name">
                                <Input
                                    id={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder="Enter document name"
                                />
                            </F>
                        )}
                    </form.Field>

                    <form.Field name="file">
                        {(field) => {
                            const isSubmitted = field.form.state.isSubmitted
                            const isInvalid = isSubmitted && !field.state.meta.isValid
                            const error = field.state.meta.errors?.[0]
                            const errorMessage = typeof error === "string" ? error : (error as any)?.message
                            return (
                                <Field data-invalid={isInvalid} className="max-w-[350px] max-h-[350px] size-full">
                                    <FieldLabel>Upload File</FieldLabel>
                                    <ImageUploadCard
                                        value={field.state.value ?? null}
                                        onChange={(file) => field.handleChange(file as unknown as File)}
                                        message="PDF, XLSX, images supported"
                                        accept="image/*,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                        className="min-h-[120px]"
                                        emptyIcon={
                                            <div className="w-10 h-10 rounded-full bg-transparent group-hover:bg-gray-100 transition-colors flex items-center justify-center">
                                                <Plus size={22} strokeWidth={2.5} className="text-gray-600" />
                                            </div>
                                        }
                                    />
                                    {isInvalid && errorMessage && (
                                        <FieldError errors={[{ message: errorMessage }]} />
                                    )}
                                </Field>
                            )
                        }}
                    </form.Field>

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
                        const canSubmit = !!values.student_id && !!values.name?.trim() && values.file instanceof File
                        return (
                            <Button
                                type="submit"
                                form="document-form"
                                className="flex-1 h-12 bg-brand-byzantine hover:bg-brand-byzantine/90 text-white rounded-sm text-sm transition-all"
                                disabled={isSubmitting || mutation.isPending || !canSubmit}
                            >
                                {mutation.isPending ? "Uploading..." : "Save Document"}
                            </Button>
                        )
                    }}
                </form.Subscribe>
            </div>
        </div>
    )
}
