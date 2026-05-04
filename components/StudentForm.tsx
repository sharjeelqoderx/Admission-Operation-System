"use client"

import React, { useCallback } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { StudentFormSchema, type StudentInput } from "@/types/schemas/student"
import { Typography } from "@/components/shared/Typography"
import { ErrorView } from "@/components/shared/error-view"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import ImageUploadCard from "./shared/image-upload-card"
import { Building, ChevronDown, School, FileUp } from "lucide-react"

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

type StudentData = {
    name?: string | null
    email?: string | null
    phone?: string | null
    date_of_birth?: string | null
    gender?: string | null
    avatar_url?: string | null
    student?: {
        country?: string | null
        nationality?: string | null
        guardian_email?: string | null
        guardian_phone?: string | null
    } | null
    education?: Array<{
        qualification?: string | null
        institution_name?: string | null
        cumulative_gpa?: number | string | null
    }> | {
        qualification?: string | null
        institution_name?: string | null
        cumulative_gpa?: number | string | null
    } | null
}

type Props = {
    mode: "create" | "edit"
    studentId?: string
    defaultData?: StudentData
}

export function StudentForm({ mode, studentId, defaultData }: Props) {
    const router = useRouter()
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: async (fd: FormData) => {
            const url = mode === "edit" ? `/api/student/${studentId}` : "/api/student"
            const method = mode === "edit" ? "PATCH" : "POST"
            const res = await fetch(url, { method, body: fd })
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error ?? "Something went wrong")
            return json
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["students"] })
            if (mode === "edit") queryClient.invalidateQueries({ queryKey: ["students", studentId] })
            router.push(mode === "edit" ? `/dashboard/student/${studentId}` : "/dashboard/student")
            router.refresh()
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
            full_name: defaultData?.name ?? "",
            email: defaultData?.email ?? "",
            phone: defaultData?.phone ?? "",
            dob: defaultData?.date_of_birth ?? "",
            gender: (defaultData?.gender?.toUpperCase() ?? "") as "MALE" | "FEMALE",
            country: defaultData?.student?.country ?? "",
            nationality: defaultData?.student?.nationality ?? "",
            guardian_email: defaultData?.student?.guardian_email ?? "",
            guardian_phone: defaultData?.student?.guardian_phone ?? "",
            avatar_url: undefined as File | undefined,
            academic_background: eduList?.length
                ? eduList.map(e => ({
                    qualification: e.qualification ?? "",
                    institution_name: e.institution_name ?? "",
                    gpa: e.cumulative_gpa?.toString() ?? "",
                }))
                : [{ qualification: "", institution_name: "", gpa: "" }],
        } as StudentInput,

        validators: { onSubmit: StudentFormSchema, onChange: StudentFormSchema },

        onSubmit: async ({ value }) => {
            const fd = new FormData()
            Object.entries(value).forEach(([key, val]) => {
                if (key === "academic_background") {
                    fd.set(key, JSON.stringify(val))
                } else if (key === "avatar_url" && val instanceof File) {
                    fd.set("avatar", val)
                } else if (val !== undefined && val !== null) {
                    fd.set(key, val as string)
                }
            })
            await mutation.mutateAsync(fd)
        },
    })

    const addRow = useCallback(() => {
        form.setFieldValue("academic_background", (prev: any) => [
            ...prev,
            { qualification: "", institution_name: "", gpa: "" }
        ])
    }, [form])

    const removeRow = useCallback((index: number) => {
        if (form.getFieldValue("academic_background").length <= 1) return
        form.setFieldValue("academic_background", (prev: any) =>
            prev.filter((_: any, i: number) => i !== index)
        )
    }, [form])

    return (
        <div className="space-y-8">
            <div className="bg-white/5 p-8 relative overflow-hidden">
                <form id="student-form" onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }} className="space-y-12 relative z-10">
                    <FieldGroup className="space-y-10">

                        {/* ── Section: Enter Student Details ── */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <Building className="size-5 text-gray-700" strokeWidth={2.5} />
                                <Typography as="h3" className="text-[24px] font-extrabold text-gray-900 tracking-tight">Enter Student Details</Typography>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6">
                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                                    <form.Field name="full_name">
                                        {(field) => (
                                            <F field={field} label="Full Name">
                                                <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Enter full name" />
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
                                                <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Enter phone number" />
                                            </F>
                                        )}
                                    </form.Field>
                                </div>

                                <div className="md:col-span-1">
                                    <form.Field name="avatar_url">
                                        {(field) => (
                                            <div className="space-y-2 h-full flex flex-col">
                                                <FieldLabel className="text-[13px] font-bold text-gray-900">Upload Profile Picture</FieldLabel>
                                                <ImageUploadCard
                                                    value={field.state.value ?? (defaultData?.avatar_url ?? null)}
                                                    onChange={(file) => field.handleChange(file as unknown as File)}
                                                    message="Passport size picture"
                                                    className="flex-1 min-h-[144px]"
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

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6">
                                <form.Field name="guardian_phone">
                                    {(field) => (
                                        <F field={field} label="Parent/Guardian Phone">
                                            <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Enter phone number" />
                                        </F>
                                    )}
                                </form.Field>

                                <form.Field name="dob">
                                    {(field) => (
                                        <F field={field} label="Date Of Birth">
                                            <Input id={field.name} type="date" value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} />
                                        </F>
                                    )}
                                </form.Field>

                                <form.Field name="gender">
                                    {(field) => (
                                        <F field={field} label="Select Gender">
                                            <Select value={field.state.value} onValueChange={v => field.handleChange(v as "MALE" | "FEMALE")}>
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
                                        <F field={field} label="Country/Location">
                                            <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Enter country name" />
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

                                <div className="md:col-span-2">
                                    <form.Field name="nationality">
                                        {(field) => (
                                            <F field={field} label="Nationality">
                                                <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Enter your nationality" />
                                            </F>
                                        )}
                                    </form.Field>
                                </div>

                                <div className="md:col-span-1">
                                    <div className="space-y-2">
                                        <FieldLabel className="text-[13px] font-bold text-gray-900">Upload Passport</FieldLabel>
                                        <ImageUploadCard message="Passport picture" className="min-h-[100px]" />
                                    </div>
                                </div>
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

                                <Button
                                    type="button"
                                    size="lg"
                                    className="font-light"
                                    onClick={addRow}
                                >
                                    + Add More
                                </Button>
                            </div>

                            <form.Field name="academic_background">
                                {(field) => (
                                    <div className="space-y-6">

                                        {field.state.value.map((_, index: number) => (
                                            <div key={index} className="grid md:grid-cols-3 gap-4">

                                                {/* ── Qualification ── */}
                                                <div className="space-y-1">
                                                    <Typography as="span" className="text-sm font-medium text-gray-900">
                                                        Qualification
                                                    </Typography>
                                                    <Input
                                                        placeholder="Enter qualification"
                                                        value={field.state.value[index].qualification}
                                                        onChange={(e) => {
                                                            const updated = [...field.state.value]
                                                            updated[index] = {
                                                                ...updated[index],
                                                                qualification: e.target.value,
                                                            }
                                                            field.handleChange(updated)
                                                        }}
                                                    />
                                                </div>

                                                {/* ── Institution ── */}
                                                <div className="space-y-1">
                                                    <Typography as="span" className="text-sm font-medium text-gray-900">
                                                        Institution Name
                                                    </Typography>
                                                    <Input
                                                        placeholder="Enter institution"
                                                        value={field.state.value[index].institution_name}
                                                        onChange={(e) => {
                                                            const updated = [...field.state.value]
                                                            updated[index] = {
                                                                ...updated[index],
                                                                institution_name: e.target.value,
                                                            }
                                                            field.handleChange(updated)
                                                        }}
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <Typography as="span" className="text-sm font-medium text-gray-900">
                                                        GPA
                                                    </Typography>

                                                    <div className="flex gap-2 items-stretch">
                                                        <Input
                                                            placeholder="Enter GPA"
                                                            value={field.state.value[index].gpa}
                                                            onChange={(e) => {
                                                                const updated = [...field.state.value]
                                                                updated[index] = {
                                                                    ...updated[index],
                                                                    gpa: e.target.value,
                                                                }
                                                                field.handleChange(updated)
                                                            }}
                                                        />

                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="h-full self-stretch min-h-12"
                                                            disabled={field.state.value.length <= 1}
                                                            onClick={() => removeRow(index)}
                                                        >
                                                            Remove
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                    </div>
                                )}
                            </form.Field>
                        </div>
                    </FieldGroup>
                </form>

                <div className="pt-10">
                    <ErrorView message={apiError} />
                </div>
                <div className="mt-12 border-t border-gray-200/40 flex flex-row items-center justify-between gap-4 w-full">

                    <Button variant="outline" disabled className="flex-1 h-12 border border-brand-byzantine text-brand-byzantine hover:text-brand-byzantine hover:bg-brand-byzantine/5 rounded-sm font-bold">
                        Save Student Info
                    </Button>

                    <form.Subscribe selector={s => ({ isSubmitting: s.isSubmitting, isValid: s.isValid })}>
                        {({ isSubmitting, isValid }) => (
                            <Button
                                type="submit"
                                form="student-form"
                                className="flex-1 h-12 bg-brand-byzantine hover:bg-brand-byzantine/90 text-white rounded-sm text-sm transition-all"
                                disabled={isSubmitting || mutation.isPending || !isValid}
                            >
                                {mutation.isPending ? "Processing..." : mode === "edit" ? "Update Student" : "Register"}
                            </Button>
                        )}
                    </form.Subscribe>
                </div>
            </div>
        </div>
    )
}
