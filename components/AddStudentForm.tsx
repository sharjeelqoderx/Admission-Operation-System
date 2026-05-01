"use client"

import React from "react"
import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { AddStudentSchema, type AddStudentInput } from "@/types/schemas/student"
import { useStudents } from "@/hooks/useStudents"
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

function F({ field, label, children }: { field: any; label: string; children: React.ReactNode }) {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
    const error = field.state.meta.errors?.[0] as string | undefined
    return (
        <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
            {children}
            {isInvalid && error && <FieldError errors={[{ message: error }]} />}
        </Field>
    )
}

export function AddStudentForm() {
    const router = useRouter()
    const { addStudent } = useStudents()
    const apiError = useMemo(() => addStudent.error instanceof Error ? addStudent.error.message : "", [addStudent.error])

    const form = useForm({
        defaultValues: {
            full_name: "",
            email: "",
            phone: "",
            password: "",
            dob: "",
            gender: "" as "MALE" | "FEMALE",
            country: "",
            nationality: "",
            guardian_email: "",
            guardian_phone: "",
            qualification: "",
            institution_name: "",
            gpa: "",
            avatar_url: undefined as unknown as File,
        } as AddStudentInput,
        validators: { onSubmit: AddStudentSchema },
        onSubmit: async ({ value }) => {
            const fd = new FormData()
            fd.set("full_name", value.full_name)
            fd.set("email", value.email)
            fd.set("phone", value.phone)
            fd.set("password", value.password)
            fd.set("dob", value.dob)
            fd.set("gender", value.gender)
            fd.set("country", value.country)
            fd.set("nationality", value.nationality)
            fd.set("guardian_email", value.guardian_email)
            fd.set("guardian_phone", value.guardian_phone)
            fd.set("qualification", value.qualification)
            fd.set("institution_name", value.institution_name)
            fd.set("gpa", value.gpa)
            if (value.avatar_url) fd.set("avatar", value.avatar_url)

            await addStudent.mutateAsync(fd as any)
            router.push("/dashboard/student")
            router.refresh()
        },
    })

    return (
        <div className="space-y-8">
            <form id="add-student-form" onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }} className="space-y-10">
                <FieldGroup>

                    {/* ── Student Details ── */}
                    <Typography as="h3" font="sub-heading" className="font-bold">Student Details</Typography>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                        <form.Field name="avatar_url">
                            {(field) => {
                                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                                const error = field.state.meta.errors?.[0]
                                return (
                                    <div className="sm:col-span-2 space-y-1">
                                        <ImageUploadCard
                                            value={field.state.value ?? null}
                                            onChange={(file) => field.handleChange(file as unknown as File)}
                                            message="Upload profile picture (required)"
                                        />
                                        {isInvalid && error && <p className="text-destructive text-sm">{typeof error === "string" ? error : (error as any)?.message ?? "Profile picture is required"}</p>}
                                    </div>
                                )
                            }}
                        </form.Field>

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
                                    <Input id={field.name} type="email" value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Enter email" />
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

                        <form.Field name="password">
                            {(field) => (
                                <F field={field} label="Password">
                                    <Input id={field.name} type="password" value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="••••••••" />
                                </F>
                            )}
                        </form.Field>
                    </div>

                    {/* ── Basic Info ── */}
                    <Typography as="h3" font="sub-heading" className="font-bold mt-6">Basic Info</Typography>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                        <form.Field name="dob">
                            {(field) => (
                                <F field={field} label="Date of Birth">
                                    <Input id={field.name} type="date" value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} />
                                </F>
                            )}
                        </form.Field>

                        <form.Field name="gender">
                            {(field) => (
                                <F field={field} label="Gender">
                                    <Select value={field.state.value} onValueChange={v => field.handleChange(v as "MALE" | "FEMALE")}>
                                        <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
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
                                    <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Enter country" />
                                </F>
                            )}
                        </form.Field>

                        <form.Field name="nationality">
                            {(field) => (
                                <F field={field} label="Nationality">
                                    <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="e.g. Pakistani" />
                                </F>
                            )}
                        </form.Field>

                        <form.Field name="guardian_email">
                            {(field) => (
                                <F field={field} label="Guardian Email">
                                    <Input id={field.name} type="email" value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Guardian email" />
                                </F>
                            )}
                        </form.Field>

                        <form.Field name="guardian_phone">
                            {(field) => (
                                <F field={field} label="Guardian Phone">
                                    <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Guardian phone" />
                                </F>
                            )}
                        </form.Field>
                    </div>

                    {/* ── Academic Background ── */}
                    <Typography as="h3" font="sub-heading" className="font-bold mt-6">Academic Background</Typography>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

                        <form.Field name="qualification">
                            {(field) => (
                                <F field={field} label="Highest Qualification">
                                    <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="e.g. Bachelor's" />
                                </F>
                            )}
                        </form.Field>

                        <form.Field name="institution_name">
                            {(field) => (
                                <F field={field} label="Institution Name">
                                    <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Enter institution" />
                                </F>
                            )}
                        </form.Field>

                        <form.Field name="gpa">
                            {(field) => (
                                <F field={field} label="Cumulative GPA">
                                    <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="0.0 – 4.0" />
                                </F>
                            )}
                        </form.Field>
                    </div>

                </FieldGroup>
            </form>

            <ErrorView message={apiError} />

            <form.Subscribe selector={s => ({ isSubmitting: s.isSubmitting, isValid: s.isValid })}>
                {({ isSubmitting, isValid }) => (
                    <Button type="submit" form="add-student-form" className="w-full" disabled={isSubmitting || addStudent.isPending || !isValid}>
                        {addStudent.isPending ? "Creating..." : "Create Student"}
                    </Button>
                )}
            </form.Subscribe>
        </div>
    )
}
