"use client"

import React, { useCallback } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { StudentFormSchema } from "@/types/schemas/student"
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
import { DatePicker } from "@/components/shared/date-picker"
import { CountrySelect } from "@/components/shared/country-select"
import { Building, ChevronDown, School, FileUp } from "lucide-react"
import { resolveGradeType, type GradeType } from "@/types/schemas/academic"
import { useDegrees, formatDegreeLabel } from "@/hooks/useDegrees"

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

export function StudentForm({ mode, studentId, defaultData }: Props) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const { data: degrees = [], isLoading: loadingDegrees } = useDegrees()

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
        },
        validators: {
            onSubmit: StudentFormSchema,
        },

        onSubmit: async ({ value }) => {
            const fd = new FormData()
            fd.set("full_name", value.full_name)
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

            await mutation.mutateAsync(fd)
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
            <div className="bg-white/5 p-8 relative overflow-hidden">

                <form id="student-form" onSubmit={handleFormSubmit} className="space-y-12 relative z-10">
                    <FieldGroup className="space-y-10">

                        {/* ── Section: Enter Student Details ── */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <Building className="size-5 text-gray-700" strokeWidth={2.5} />
                                <Typography as="h3" font="text-xl" className="text-gray-900 tracking-tight">Enter Student Details</Typography>
                            </div>


                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                                {/* Inputs: Full Name, Email, Phone */}
                                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
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

                                    <div className="sm:col-span-2">
                                        <form.Field name="phone">
                                            {(field) => (
                                                <F field={field} label="Phone">
                                                    <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Enter phone number" />
                                                </F>
                                            )}
                                        </form.Field>
                                    </div>
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
                                            <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Enter phone number" />
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

                                <div className="col-span-1 sm:col-span-1 lg:col-span-2">
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
                                </div>

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
                                        {mutation.isPending ? "Processing..." : mode === "edit" ? "Update Student" : "Register"}
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
