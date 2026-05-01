"use client"

import { useState, useRef } from "react"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { useStudents } from "@/hooks/useStudents"
import { Typography } from "@/components/shared/Typography"
import { Button } from "@/components/ui/button"
import { Calendar, FileBadge, FileText, ImagePlus, ChevronDown, AlertCircle, CheckCircle2, Loader2, type LucideIcon } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

// ─── Field-level Zod validators ─────────────────────────────────────────────
const Validators = {
    full_name:    z.string().min(2, "Full name must be at least 2 characters"),
    email:        z.string().email("Please enter a valid email address"),
    phone:        z.string().regex(/^\+?[0-9\s\-().]{7,20}$/, "Enter a valid phone number").optional().or(z.literal("")),
    password:     z.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Must contain an uppercase letter").regex(/[0-9]/, "Must contain a number").optional().or(z.literal("")),
    dob:          z.string().optional(),
    gender:       z.enum(["Male", "Female", "Other", ""], { message: "Please select a gender" }).optional(),
    country:      z.string().min(2, "Country must be at least 2 characters").optional().or(z.literal("")),
    nationality:  z.string().min(2, "Nationality must be at least 2 characters").optional().or(z.literal("")),
    parent_email: z.string().email("Enter a valid guardian email").optional().or(z.literal("")),
    parent_phone: z.string().regex(/^\+?[0-9\s\-().]{7,20}$/, "Enter a valid phone number").optional().or(z.literal("")),
    qualification:    z.string().optional(),
    institution_name: z.string().optional(),
    gpa: z.string().regex(/^(\d(\.\d{1,2})?|[0-3](\.\d{1,2})?|4(\.0{1,2})?)$/, "GPA must be between 0.0 – 4.0").optional().or(z.literal("")),
}

// ─── InputField Component ─────────────────────────────────────────────────────
function InputField({ field, label, placeholder, type = "text", icon: Icon, required = false }: {
    field: any; label: string; placeholder: string; type?: string; icon?: LucideIcon; required?: boolean
}) {
    const hasError = field.state.meta.isTouched && field.state.meta.errors.length > 0
    const isValid  = field.state.meta.isTouched && !field.state.meta.errors.length && field.state.value

    return (
        <div className="flex flex-col gap-1.5 w-full">
            <Typography as="label" className="text-xs font-bold text-gray-900">
                {label} {required && <span className="text-red-500">*</span>}
            </Typography>
            <div className="relative">
                <input
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    type={type}
                    placeholder={placeholder}
                    className={`w-full h-11 px-4 pr-10 rounded-lg bg-[#f4f4f5] border-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all duration-200
                        ${hasError  ? 'border-red-400 bg-red-50/50 focus:ring-2 focus:ring-red-400/20' :
                          isValid   ? 'border-emerald-400 bg-emerald-50/30 focus:ring-2 focus:ring-emerald-400/20' :
                                      'border-gray-200 focus:border-[#9B51E0] focus:ring-2 focus:ring-[#9B51E0]/20'}`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    {hasError  ? <AlertCircle  className="size-4 text-red-400" /> :
                     isValid   ? <CheckCircle2 className="size-4 text-emerald-400" /> :
                     Icon      ? <Icon className="size-4 text-gray-400" /> : null}
                </div>
            </div>
            {hasError && (
                <div className="flex items-center gap-1 mt-0.5">
                    <AlertCircle className="size-3 text-red-500 shrink-0" />
                    <Typography as="span" className="text-[11px] text-red-500 font-medium">
                        {field.state.meta.errors[0]?.message ?? field.state.meta.errors[0]}
                    </Typography>
                </div>
            )}
        </div>
    )
}

// ─── SelectField Component ────────────────────────────────────────────────────
function SelectField({ field, label, options, required = false }: {
    field: any; label: string; options: { value: string; label: string }[]; required?: boolean
}) {
    const hasError = field.state.meta.isTouched && field.state.meta.errors.length > 0
    const isValid  = field.state.meta.isTouched && !field.state.meta.errors.length && field.state.value

    return (
        <div className="flex flex-col gap-1.5 w-full">
            <Typography as="label" className="text-xs font-bold text-gray-900">
                {label} {required && <span className="text-red-500">*</span>}
            </Typography>
            <div className="relative">
                <select
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className={`w-full h-11 px-4 pr-10 appearance-none rounded-lg bg-[#f4f4f5] border-2 text-sm focus:outline-none transition-all duration-200
                        ${hasError  ? 'border-red-400 bg-red-50/50 text-gray-900' :
                          isValid   ? 'border-emerald-400 bg-emerald-50/30 text-gray-900' :
                                      'border-gray-200 text-gray-500 focus:border-[#9B51E0]'}`}
                >
                    <option value="">Select {label.toLowerCase()}</option>
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
            </div>
            {hasError && (
                <div className="flex items-center gap-1 mt-0.5">
                    <AlertCircle className="size-3 text-red-500 shrink-0" />
                    <Typography as="span" className="text-[11px] text-red-500 font-medium">
                        {field.state.meta.errors[0]?.message ?? field.state.meta.errors[0]}
                    </Typography>
                </div>
            )}
        </div>
    )
}

// ─── DropzoneField Component ──────────────────────────────────────────────────
function DropzoneField({ field, label, instructions }: { field: any; label: string; instructions: string }) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [preview, setPreview] = useState<string | null>(field.state.value || null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                const b64 = reader.result as string
                setPreview(b64)
                field.handleChange(b64)
            }
            reader.readAsDataURL(file)
        }
    }

    return (
        <div className="flex flex-col gap-1.5 w-full h-full">
            <Typography as="label" className="text-xs font-bold text-gray-900">{label}</Typography>
            <div
                onClick={() => inputRef.current?.click()}
                className="relative flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 bg-[#f4f4f5] rounded-lg p-6 cursor-pointer hover:border-[#9B51E0]/50 hover:bg-purple-50/30 transition-all duration-200 overflow-hidden min-h-[140px] group"
            >
                <input type="file" ref={inputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                {preview ? (
                    <>
                        <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Typography as="span" className="text-white text-xs font-bold">Click to change</Typography>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="size-12 rounded-xl bg-gray-200/80 group-hover:bg-purple-100 flex items-center justify-center mb-3 transition-colors">
                            <ImagePlus className="size-6 text-gray-400 group-hover:text-[#9B51E0] transition-colors" strokeWidth={1.5} />
                        </div>
                        <Typography as="p" className="text-[11px] text-gray-500 text-center max-w-[160px] leading-tight">
                            <span className="text-[#0ea5e9] font-bold">Click to upload</span> {instructions}
                        </Typography>
                        <Typography as="p" className="text-[10px] text-gray-400 mt-1">PNG, JPG up to 5MB</Typography>
                    </>
                )}
            </div>
        </div>
    )
}

// ─── Form Error Banner ────────────────────────────────────────────────────────
function FormErrorBanner({ error }: { error: string | null }) {
    if (!error) return null
    return (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
            <div>
                <Typography as="p" className="text-sm font-bold text-red-700">Failed to update student</Typography>
                <Typography as="p" className="text-xs text-red-600 mt-0.5">{error}</Typography>
            </div>
        </div>
    )
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
    return (
        <div className="flex items-center gap-2 pb-1 border-b border-gray-200/80">
            <div className="size-7 rounded-lg bg-[#9B51E0]/10 flex items-center justify-center">
                <Icon className="size-4 text-[#9B51E0]" />
            </div>
            <Typography as="h3" className="text-base font-bold text-gray-900">{title}</Typography>
        </div>
    )
}

// ─── Loading State ────────────────────────────────────────────────────────────
function LoadingState() {
    return (
        <div className="py-20 flex flex-col items-center gap-3 text-center">
            <Loader2 className="size-8 text-[#9B51E0] animate-spin" />
            <Typography as="p" className="text-sm font-medium text-gray-500">Loading student details...</Typography>
        </div>
    )
}

// ─── Error State ──────────────────────────────────────────────────────────────
function ErrorState() {
    return (
        <div className="py-20 flex flex-col items-center gap-3 text-center">
            <div className="size-14 rounded-full bg-red-50 flex items-center justify-center">
                <AlertCircle className="size-7 text-red-400" />
            </div>
            <Typography as="p" className="text-sm font-bold text-gray-700">Student not found</Typography>
            <Typography as="p" className="text-xs text-gray-500">The student record could not be loaded. Please go back and try again.</Typography>
            <Link href="/dashboard/student">
                <Button variant="outline" className="mt-2 h-10 px-6 rounded-xl border-gray-300 text-gray-700">← Back to Students</Button>
            </Link>
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function EditStudentForm() {
    const searchParams = useSearchParams()
    const id = searchParams.get("id") || ""
    const router = useRouter()
    const [submitError, setSubmitError] = useState<string | null>(null)

    const { getStudent, editStudent } = useStudents()
    const { data: student, isLoading, isError } = getStudent(id)

    const form = useForm({
        defaultValues: {
            full_name:        student?.full_name || "",
            email:            student?.email || "",
            phone:            student?.phone || "",
            password:         "",
            dob:              student?.date_of_birth || "",
            gender:           student?.gender ? (student.gender.charAt(0).toUpperCase() + student.gender.slice(1)) : "",
            country:          student?.country || "",
            nationality:      student?.nationality || "",
            parent_email:     student?.guardian_email || "",
            parent_phone:     student?.guardian_phone || "",
            qualification:    student?.academic_background?.[0]?.qualification || "",
            institution_name: student?.academic_background?.[0]?.institute_name || "",
            gpa:              student?.academic_background?.[0]?.gpa?.toString() || "",
            profile_image:    student?.picture || "",
            passport_url:     student?.website || "",
        },
        onSubmit: async ({ value }) => {
            setSubmitError(null)
            try {
                const payload = { ...value }
                if (!payload.password) delete (payload as any).password
                await editStudent.mutateAsync({ id, data: payload as any })
                router.push(`/dashboard/student/${id}`)
            } catch (err: any) {
                setSubmitError(err.message || "Something went wrong. Please try again.")
            }
        }
    })

    if (isLoading) return <LoadingState />
    if (isError || !student) return <ErrorState />

    return (
        <form
            onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit() }}
            className="space-y-8 pb-10"
        >
            <FormErrorBanner error={submitError} />

            {/* Section 1: Student Details */}
            <div className="space-y-5">
                <SectionHeader icon={FileBadge} title="Student Details" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <form.Field name="full_name" validators={{ onBlur: ({ value }) => { const r = Validators.full_name.safeParse(value); return r.success ? undefined : r.error.issues[0].message } }}>
                            {(field) => <InputField field={field} label="Full Name" placeholder="e.g. John Smith" required />}
                        </form.Field>
                        <form.Field name="email" validators={{ onBlur: ({ value }) => { const r = Validators.email.safeParse(value); return r.success ? undefined : r.error.issues[0].message } }}>
                            {(field) => <InputField field={field} label="Email Address" placeholder="student@email.com" type="email" required />}
                        </form.Field>
                        <form.Field name="phone" validators={{ onBlur: ({ value }) => { const r = Validators.phone.safeParse(value); return r.success ? undefined : r.error.issues[0].message } }}>
                            {(field) => <InputField field={field} label="Phone Number" placeholder="+1 (555) 000-0000" type="tel" />}
                        </form.Field>
                        <form.Field name="password" validators={{ onBlur: ({ value }) => { const r = Validators.password.safeParse(value); return r.success ? undefined : r.error.issues[0].message } }}>
                            {(field) => <InputField field={field} label="New Password" placeholder="Leave blank to keep current" type="password" />}
                        </form.Field>
                    </div>
                    <div className="md:col-span-1">
                        <form.Field name="profile_image">
                            {(field) => <DropzoneField field={field} label="Profile Picture" instructions="passport size photo" />}
                        </form.Field>
                    </div>
                </div>
            </div>

            {/* Section 2: Basic Info */}
            <div className="space-y-5">
                <SectionHeader icon={FileText} title="Basic Info" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <form.Field name="dob" validators={{ onBlur: ({ value }) => { const r = Validators.dob.safeParse(value); return r.success ? undefined : r.error.issues[0].message } }}>
                            {(field) => <InputField field={field} label="Date of Birth" placeholder="YYYY-MM-DD" icon={Calendar} type="date" />}
                        </form.Field>
                        <form.Field name="gender" validators={{ onBlur: ({ value }) => { const r = Validators.gender.safeParse(value); return r.success ? undefined : r.error.issues[0].message } }}>
                            {(field) => (
                                <SelectField field={field} label="Gender" options={[
                                    { value: "Male", label: "Male" },
                                    { value: "Female", label: "Female" },
                                    { value: "Other", label: "Other" }
                                ]} />
                            )}
                        </form.Field>
                        <form.Field name="country" validators={{ onBlur: ({ value }) => { const r = Validators.country.safeParse(value); return r.success ? undefined : r.error.issues[0].message } }}>
                            {(field) => <InputField field={field} label="Country / Location" placeholder="e.g. Germany" />}
                        </form.Field>
                        <form.Field name="nationality" validators={{ onBlur: ({ value }) => { const r = Validators.nationality.safeParse(value); return r.success ? undefined : r.error.issues[0].message } }}>
                            {(field) => <InputField field={field} label="Nationality" placeholder="e.g. Pakistani" />}
                        </form.Field>
                        <form.Field name="parent_email" validators={{ onBlur: ({ value }) => { const r = Validators.parent_email.safeParse(value); return r.success ? undefined : r.error.issues[0].message } }}>
                            {(field) => <InputField field={field} label="Guardian Email" placeholder="guardian@email.com" type="email" />}
                        </form.Field>
                        <form.Field name="parent_phone" validators={{ onBlur: ({ value }) => { const r = Validators.parent_phone.safeParse(value); return r.success ? undefined : r.error.issues[0].message } }}>
                            {(field) => <InputField field={field} label="Guardian Phone" placeholder="+1 (555) 000-0000" type="tel" />}
                        </form.Field>
                    </div>
                    <div className="md:col-span-1">
                        <form.Field name="passport_url">
                            {(field) => <DropzoneField field={field} label="Passport Document" instructions="clear photo of passport" />}
                        </form.Field>
                    </div>
                </div>
            </div>

            {/* Section 3: Academic Background */}
            <div className="space-y-5">
                <SectionHeader icon={FileBadge} title="Academic Background" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <form.Field name="qualification" validators={{ onBlur: ({ value }) => { const r = Validators.qualification.safeParse(value); return r.success ? undefined : r.error.issues[0].message } }}>
                        {(field) => <InputField field={field} label="Highest Qualification" placeholder="e.g. Bachelor's in CS" />}
                    </form.Field>
                    <form.Field name="institution_name" validators={{ onBlur: ({ value }) => { const r = Validators.institution_name.safeParse(value); return r.success ? undefined : r.error.issues[0].message } }}>
                        {(field) => <InputField field={field} label="Institution Name" placeholder="e.g. MIT" />}
                    </form.Field>
                    <form.Field name="gpa" validators={{ onBlur: ({ value }) => { const r = Validators.gpa.safeParse(value); return r.success ? undefined : r.error.issues[0].message } }}>
                        {(field) => <InputField field={field} label="Cumulative GPA" placeholder="e.g. 3.8" />}
                    </form.Field>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gray-200/60">
                <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                    {([canSubmit, isSubmitting]) => (
                        <Button
                            type="submit"
                            disabled={!canSubmit || !!isSubmitting}
                            variant="outline"
                            className="h-12 px-10 border-2 border-[#9B51E0] text-[#9B51E0] hover:bg-[#9B51E0]/5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                        >
                            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                            {isSubmitting ? "Saving..." : "Save Student Info"}
                        </Button>
                    )}
                </form.Subscribe>
                <Button
                    type="button"
                    variant="outline"
                    className="h-12 px-10 border-2 border-[#9B51E0] text-[#9B51E0] hover:bg-[#9B51E0]/5 rounded-xl font-semibold transition-all"
                >
                    + Add More
                </Button>
            </div>
        </form>
    )
}
