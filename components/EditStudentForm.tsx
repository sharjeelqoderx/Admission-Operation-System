"use client"

import React, { useMemo } from "react"
import { useForm } from "@tanstack/react-form"
import { useRouter, useSearchParams } from "next/navigation"
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
import { DatePicker } from "@/components/shared/date-picker"
import { Building, FileText, ChevronDown, GraduationCap, Loader2 } from "lucide-react"

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

export function EditStudentForm() {
    const searchParams = useSearchParams()
    const id = searchParams.get("id") || ""
    const { getStudent } = useStudents()
    const { data: student, isLoading, isError } = getStudent(id)

    if (isLoading) return (
        <div className="py-20 flex flex-col items-center gap-3 text-center">
            <Loader2 className="size-8 text-[#9B51E0] animate-spin" />
            <Typography as="p" className="text-sm font-medium text-gray-500">Loading student details...</Typography>
        </div>
    )

    if (isError || !student) return (
        <div className="py-20 flex flex-col items-center gap-3 text-center">
            <Typography as="p" className="text-sm font-bold text-gray-700">Student not found</Typography>
            <Typography as="p" className="text-xs text-gray-500">The student record could not be loaded. Please check the ID or try again.</Typography>
        </div>
    )

    return <EditFormContent studentData={student} id={id} />
}

function EditFormContent({ studentData, id }: { studentData: any; id: string }) {
    const router = useRouter()
    const { editStudent } = useStudents()

    // API structure: studentData is the profile + { student: {...}, education: {...} }
    const profile = studentData
    const student = studentData.student
    const edu = studentData.education

    const apiError = useMemo(() => editStudent.error instanceof Error ? editStudent.error.message : "", [editStudent.error])

    const form = useForm({
        defaultValues: {
            full_name: profile?.name || "",
            email: profile?.email || "",
            phone: profile?.phone || "",
            password: "",
            dob: profile?.date_of_birth || "",
            gender: (profile?.gender?.toUpperCase() || "") as "MALE" | "FEMALE",
            country: student?.country || "",
            nationality: student?.nationality || "",
            guardian_email: student?.guardian_email || "",
            guardian_phone: student?.guardian_phone || "",
            qualification: edu?.qualification || "",
            institution_name: edu?.institution_name || edu?.institute_name || "",
            gpa: edu?.cumulative_gpa?.toString() || edu?.gpa?.toString() || "",
            avatar_url: undefined as unknown as File,
            passport_file_url: undefined as unknown as File,
        },
        onSubmit: async ({ value }) => {
            const fd = new FormData()
            fd.set("full_name", value.full_name)
            fd.set("email", value.email)
            fd.set("phone", value.phone)
            if (value.password) fd.set("password", value.password)
            fd.set("dob", value.dob)
            fd.set("gender", value.gender)
            fd.set("country", value.country)
            fd.set("nationality", value.nationality)
            fd.set("guardian_email", value.guardian_email)
            fd.set("guardian_phone", value.guardian_phone)
            fd.set("qualification", value.qualification)
            fd.set("institution_name", value.institution_name)
            fd.set("gpa", value.gpa)
            if (value.avatar_url) fd.set("avatar_url", value.avatar_url)
            if (value.passport_file_url) fd.set("passport_file_url", value.passport_file_url)

            await editStudent.mutateAsync({ id, data: fd as any })
            router.push(`/dashboard/student/${id}`)
            router.refresh()
        },
    })

    return (
        <div className="space-y-8">
            <div className="bg-white/5 p-8 relative overflow-hidden">
                <form id="edit-student-form" onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }} className="space-y-12 relative z-10">
                    <FieldGroup className="space-y-10">

                        {/* ── Section: Student Details ── */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <Building className="size-5 text-gray-700" strokeWidth={2.5} />
                                <Typography as="h3" className="text-[17px] font-extrabold text-gray-900 tracking-tight">Student Details</Typography>
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
                                                <Input id={field.name} type="password" value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Enter new password (leave blank to keep current)" className="h-12 bg-white border-none rounded-sm shadow-sm focus:ring-1 focus:ring-purple-500 transition-all text-sm" />
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
                                                    value={field.state.value ?? (student?.picture ? { preview: student.picture } : null)}
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
                                            <DatePicker
                                                value={field.state.value}
                                                onChange={v => field.handleChange(v)}
                                                placeholder="Select date of birth"
                                            />
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
                                    <form.Field name="passport_file_url">
                                        {(field) => (
                                            <div className="space-y-2">
                                                <FieldLabel className="text-[13px] font-bold text-gray-900">Upload Passport</FieldLabel>
                                                <ImageUploadCard
                                                    value={field.state.value ?? (student?.passport_file_url ?? null)}
                                                    onChange={(file) => field.handleChange(file as unknown as File)}
                                                    message="Passport picture"
                                                    className="min-h-[100px]"
                                                />
                                            </div>
                                        )}
                                    </form.Field>
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
                                            <Input
                                                id={field.name}
                                                value={field.state.value}
                                                className="h-12 bg-white border-none rounded-sm shadow-sm text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                placeholder="0.00"
                                                onChange={e => {
                                                    const val = e.target.value.replace(/[^0-9.]/g, "")
                                                    if (val.split(".").length > 2) return
                                                    field.handleChange(val)
                                                }}
                                            />
                                        </F>
                                    )}
                                </form.Field>
                            </div>
                        </div>

                    </FieldGroup>
                </form>

                <div className="mt-12 pt-10 border-t border-gray-200/40 flex flex-col md:flex-row items-center justify-between gap-4 w-full">
                    <div className="flex-1">
                        <ErrorView message={apiError} />
                    </div>

                    <div className="flex flex-1 gap-4 w-full md:w-auto">
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
                                    form="edit-student-form"
                                    className="flex-1 h-12 bg-[#9B51E0] hover:bg-[#8a42cf] text-white rounded-sm font-extrabold text-sm shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2"
                                    disabled={isSubmitting || editStudent.isPending || !isValid}
                                >
                                    {(isSubmitting || editStudent.isPending) && <Loader2 className="size-4 animate-spin" />}
                                    {editStudent.isPending ? "Processing..." : "Update Profile"}
                                </Button>
                            )}
                        </form.Subscribe>
                    </div>
                </div>
            </div>
        </div>
    )
}
