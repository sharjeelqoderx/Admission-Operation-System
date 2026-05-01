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
import { Building, FileText, ChevronDown, GraduationCap } from "lucide-react"

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
        <div className="space-y-8 pb-20">
            {/* Transparent Form Card */}
            <div className="bg-white/5  p-8 relative overflow-hidden">
                <form id="add-student-form" onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }} className="space-y-12 relative z-10">
                    <FieldGroup className="space-y-10">

                        {/* ── Section: Enter Student Details ── */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <Building className="size-5 text-gray-700" strokeWidth={2.5} />
                                <Typography as="h3" className="text-[17px] font-extrabold text-gray-900 tracking-tight">Enter Student Details</Typography>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6">
                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                                    <form.Field name="full_name">
                                        {(field) => (
                                            <F field={field} label="Full Name">
                                                <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Enter full name" className="h-12 bg-white border-none rounded-sm shadow-sm focus:ring-1 focus:ring-purple-500 transition-all text-sm" />
                                            </F>
                                        )}
                                    </form.Field>

                                    <form.Field name="email">
                                        {(field) => (
                                            <F field={field} label="Email">
                                                <Input id={field.name} type="email" value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Enter your email" className="h-12 bg-white border-none rounded-sm shadow-sm focus:ring-1 focus:ring-purple-500 transition-all text-sm" />
                                            </F>
                                        )}
                                    </form.Field>

                                    <form.Field name="phone">
                                        {(field) => (
                                            <F field={field} label="Phone">
                                                <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Enter phone number" className="h-12 bg-white border-none rounded-sm shadow-sm focus:ring-1 focus:ring-purple-500 transition-all text-sm" />
                                            </F>
                                        )}
                                    </form.Field>

                                    <form.Field name="password">
                                        {(field) => (
                                            <F field={field} label="Password">
                                                <Input id={field.name} type="password" value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Enter password" className="h-12 bg-white border-none rounded-sm shadow-sm focus:ring-1 focus:ring-purple-500 transition-all text-sm" />
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
                                                    value={field.state.value ?? null}
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
                            <div className="flex items-center gap-2 border-b border-gray-200/40 pb-2">
                                <FileText className="size-5 text-gray-700" strokeWidth={2.5} />
                                <Typography as="h3" className="text-[17px] font-extrabold text-gray-900 tracking-tight flex-1">Basic Info</Typography>
                                <ChevronDown className="size-5 text-gray-500" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6">
                                <form.Field name="guardian_phone">
                                    {(field) => (
                                        <F field={field} label="Contact Number">
                                            <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Enter phone number" className="h-12 bg-white border-none rounded-sm shadow-sm text-sm" />
                                        </F>
                                    )}
                                </form.Field>

                                <form.Field name="dob">
                                    {(field) => (
                                        <F field={field} label="Date Of Birth">
                                            <Input id={field.name} type="date" value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} className="h-12 bg-white border-none rounded-sm shadow-sm text-sm" />
                                        </F>
                                    )}
                                </form.Field>

                                <form.Field name="gender">
                                    {(field) => (
                                        <F field={field} label="Select Gender">
                                            <Select value={field.state.value} onValueChange={v => field.handleChange(v as "MALE" | "FEMALE")}>
                                                <SelectTrigger className="h-12 bg-white border-none rounded-sm shadow-sm text-sm"><SelectValue placeholder="Select your gender" /></SelectTrigger>
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
                                            <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Enter country name" className="h-12 bg-white border-none rounded-sm shadow-sm text-sm" />
                                        </F>
                                    )}
                                </form.Field>

                                <form.Field name="guardian_email">
                                    {(field) => (
                                        <F field={field} label="Parent/Guardian Email">
                                            <Input id={field.name} type="email" value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Enter your guardian Email" className="h-12 bg-white border-none rounded-sm shadow-sm text-sm" />
                                        </F>
                                    )}
                                </form.Field>

                                <form.Field name="phone">
                                    {(field) => (
                                        <F field={field} label="Parent/Guardian Phone">
                                            <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="+123-456-7890" className="h-12 bg-white border-none rounded-sm shadow-sm text-sm" />
                                        </F>
                                    )}
                                </form.Field>

                                <div className="md:col-span-2">
                                    <form.Field name="nationality">
                                        {(field) => (
                                            <F field={field} label="Nationality">
                                                <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Enter your nationality" className="h-12 bg-white border-none rounded-sm shadow-sm text-sm" />
                                            </F>
                                        )}
                                    </form.Field>
                                </div>

                                <div className="md:col-span-1">
                                    <div className="space-y-2">
                                        <FieldLabel className="text-[13px] font-bold text-gray-900">Upload Passport</FieldLabel>
                                        <ImageUploadCard
                                            message="Passport picture"
                                            className="min-h-[100px]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Section: Academic Background ── */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <GraduationCap className="size-5 text-gray-700" strokeWidth={2.5} />
                                <Typography as="h3" className="text-[17px] font-extrabold text-gray-900 tracking-tight">Academic Background</Typography>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6">
                                <form.Field name="qualification">
                                    {(field) => (
                                        <F field={field} label="Qualification">
                                            <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Enter your qualification" className="h-12 bg-white border-none rounded-sm shadow-sm text-sm" />
                                        </F>
                                    )}
                                </form.Field>

                                <form.Field name="institution_name">
                                    {(field) => (
                                        <F field={field} label="Institution Name">
                                            <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Enter Institute Name" className="h-12 bg-white border-none rounded-sm shadow-sm text-sm" />
                                        </F>
                                    )}
                                </form.Field>

                                <form.Field name="gpa">
                                    {(field) => (
                                        <F field={field} label="Cumulative GPA">
                                            <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Enter your GPA" className="h-12 bg-white border-none rounded-sm shadow-sm text-sm" />
                                        </F>
                                    )}
                                </form.Field>
                            </div>
                        </div>

                    </FieldGroup>
                </form>

                <div className="mt-12 pt-10 border-t border-gray-200/40 flex flex-row items-center justify-between gap-4 w-full">
                    <ErrorView message={apiError} />

                    <Button variant="outline" className="flex-1 h-12 border-[#9B51E0] text-[#9B51E0] hover:bg-[#9B51E0]/5 rounded-sm font-bold text-sm">
                        Save Student Info
                    </Button>
                    <Button variant="outline" className="flex-1 h-12 border-[#9B51E0] text-[#9B51E0] hover:bg-[#9B51E0]/5 rounded-sm font-bold text-sm">
                        + Add More
                    </Button>

                    <form.Subscribe selector={s => ({ isSubmitting: s.isSubmitting, isValid: s.isValid })}>
                        {({ isSubmitting, isValid }) => (
                            <Button 
                                type="submit" 
                                form="add-student-form" 
                                className="flex-1 h-12 bg-[#9B51E0] hover:bg-[#8a42cf] text-white rounded-sm font-extrabold text-sm shadow-lg shadow-purple-500/20 transition-all" 
                                disabled={isSubmitting || addStudent.isPending || !isValid}
                            >
                                {addStudent.isPending ? "Processing..." : "Register"}
                            </Button>
                        )}
                    </form.Subscribe>
                </div>
            </div>
        </div>
    )
}
