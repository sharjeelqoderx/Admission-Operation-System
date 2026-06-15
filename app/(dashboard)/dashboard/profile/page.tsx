"use client"

import React, { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "@tanstack/react-form"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PhoneInputComponent } from "@/components/ui/phone-input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { PageLoader } from "@/components/shared/page-loader"
import { ErrorView } from "@/components/shared/error-view"
import {
    User,
    Globe,
    Building,
    Briefcase,
    Edit2,
    Plus,
    Trash2,
    GraduationCap
} from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/shared/date-picker"
import { CountrySelect } from "@/components/shared/country-select"
import ImageUploadCard from "@/components/shared/image-upload-card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useDegrees, formatDegreeLabel } from "@/hooks/useDegrees"
import {
    type AcademicFormItem,
    computePercentage,
    createEmptyAcademicItem,
    mapAcademicToFormItem,
    normalizeDateValue,
} from "@/types/schemas/academic"

type MeUser = {
    fullName?: string
    firstName?: string
    lastName?: string
    title?: string
    phone?: string
    avatarUrl?: string | null
    profile?: Record<string, string | undefined | null>
    academic?: Array<{
        qualification?: string | null
        instituteName?: string | null
        grade_type?: string | null
        gpa?: string | number | null
        obtained_marks?: string | number | null
        total_marks?: string | number | null
        start_date?: string | null
        end_date?: string | null
        about?: string | null
    }> | null
    experience?: {
        hasExperience?: "yes" | "no"
        entries?: Array<{
            jobTitle?: string
            organization?: string
            industry?: string
            country?: string
            startDate?: string
            endDate?: string
            responsibilities?: string
        }>
    } | null
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

function formatGenderLabel(gender?: string) {
    const normalized = gender?.toUpperCase()
    if (normalized === "MALE") return "Male"
    if (normalized === "FEMALE") return "Female"
    if (normalized === "OTHER") return "Other"
    return gender || "N/A"
}

function getProfileFormValues(user?: MeUser | null) {
    const title = user?.title ?? ""
    const storedGender = user?.profile?.gender?.toUpperCase() ?? ""

    return {
        title,
        firstName: user?.firstName ?? "",
        lastName: user?.lastName ?? "",
        fullName: user?.fullName ?? "",
        phone: user?.phone ?? "",
        date_of_birth: user?.profile?.dateOfBirth ?? "",
        gender: storedGender || genderFromTitle(title) || "",
        country: user?.profile?.country ?? "",
        state: user?.profile?.state ?? "",
        city: user?.profile?.city ?? "",
        nationality: user?.profile?.nationality ?? "",
        address: user?.profile?.address ?? "",
        zip_code: user?.profile?.zip_code ?? "",
        guardian_email: user?.profile?.guardian_email ?? "",
        guardian_phone: user?.profile?.guardian_phone ?? "",
        contact_person_first_name: user?.profile?.contact_person_first_name ?? "",
        contact_person_last_name: user?.profile?.contact_person_last_name ?? "",
        other_contact_number: user?.profile?.other_contact_number ?? "",
        website: user?.profile?.website ?? "",
        experience_years: user?.profile?.experience_years ?? "0",
        description: user?.profile?.description ?? "",
        avatar: null as File | null,
        academics: user?.academic?.length
            ? user.academic.map(mapAcademicToFormItem)
            : [createEmptyAcademicItem()],
        hasExperience: user?.experience?.hasExperience || "no",
        experiences: user?.experience?.entries?.map((e) => ({
            name: e.jobTitle || "",
            organization: e.organization || "",
            industry: e.industry || "",
            country: e.country || "",
            startDate: e.startDate || "",
            endDate: e.endDate || "",
            responsibility: e.responsibilities || "",
        })) || [],
    }
}

type StudentTab = "student-details" | "academic" | "experience"
type EditSection = "basic" | StudentTab

const STUDENT_TABS: { id: StudentTab; label: string; icon: React.ComponentType<{ className?: string; size?: number }> }[] = [
    { id: "student-details", label: "Student Details", icon: Globe },
    { id: "academic", label: "Academic Qualifications", icon: GraduationCap },
    { id: "experience", label: "Work Experience", icon: Briefcase },
]

function buildStudentProfileFormData(
    value: Record<string, unknown>,
    user: { avatarUrl?: string | null },
    extra?: { address?: string; zip_code?: string }
) {
    const fd = new FormData()
    fd.append("title", String(value.title ?? ""))
    fd.append("firstName", String(value.firstName ?? ""))
    fd.append("lastName", String(value.lastName ?? ""))
    fd.append("fullName", String(value.fullName ?? ""))
    fd.append("phone", String(value.phone ?? ""))
    fd.append("dob", String(value.date_of_birth ?? ""))
    const gender =
        genderFromTitle(String(value.title ?? "")) ?? String(value.gender ?? "")
    fd.append("gender", gender.toLowerCase())
    fd.append("country", String(value.country ?? ""))
    fd.append("state", String(value.state ?? ""))
    fd.append("city", String(value.city ?? ""))
    fd.append("nationality", String(value.nationality ?? ""))
    fd.append("guardianEmail", String(value.guardian_email ?? ""))
    fd.append("guardianPhone", String(value.guardian_phone ?? ""))
    if (extra?.address !== undefined) fd.append("address", extra.address)
    if (extra?.zip_code !== undefined) fd.append("zip_code", extra.zip_code)
    const avatar = value.avatar
    if (avatar instanceof File) {
        fd.append("avatar_url", avatar)
    } else if (user?.avatarUrl) {
        fd.append("avatar_url", user.avatarUrl)
    }
    return fd
}

const EDIT_PROFILE_BUTTON_CLASS =
    "bg-brand-byzantine hover:bg-brand-byzantine/90 text-white gap-2 h-12 px-6 rounded-xl w-full sm:w-auto shadow-lg shadow-brand-byzantine/20"

function ProfileEditButton({ onClick }: { onClick: () => void }) {
    return (
        <Button type="button" onClick={onClick} className={EDIT_PROFILE_BUTTON_CLASS}>
            <Edit2 size={18} />
            Edit Profile
        </Button>
    )
}

function SectionSaveActions({
    onCancel,
    onSave,
    isSaving,
    isDirty,
}: {
    onCancel: () => void
    onSave: () => void
    isSaving: boolean
    isDirty: boolean
}) {
    return (
        <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-white/20">
            <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto sm:px-8 py-6 rounded-xl border font-bold border-brand-byzantine text-brand-byzantine hover:bg-brand-byzantine/5 hover:text-brand-byzantine"
                onClick={onCancel}
            >
                Cancel
            </Button>
            <Button
                type="button"
                className="w-full sm:w-auto sm:px-12 py-6 bg-brand-byzantine hover:bg-brand-byzantine/80"
                disabled={isSaving || !isDirty}
                onClick={onSave}
            >
                {isSaving ? "Updating..." : "Save Changes"}
            </Button>
        </div>
    )
}

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

export default function ProfilePage() {
    const queryClient = useQueryClient()
    const [showSuccess, setShowSuccess] = useState(false)
    const { data: user, isLoading, isError } = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const res = await fetch("/api/me")
            if (!res.ok) throw new Error("Failed to fetch profile")
            const json = await res.json()
            return json.data
        },
        refetchOnMount: "always",
    })

    const mutation = useMutation({
        mutationFn: async (fd: FormData) => {
            const res = await fetch("/api/profile", {
                method: "POST",
                body: fd,
            })
            if (!res.ok) {
                const json = await res.json()
                throw new Error(json?.error ?? "Failed to update profile")
            }
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["me"] })
            setShowSuccess(true)
        },
    })

    const academicMutation = useMutation({
        mutationFn: async (payload: { userId: string; academics: unknown[] }) => {
            const res = await fetch("/api/academic", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            if (!res.ok) {
                const json = await res.json()
                throw new Error(json?.error ?? "Failed to update academics")
            }
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["me"] })
            setShowSuccess(true)
        },
    })

    const experienceMutation = useMutation({
        mutationFn: async (payload: {
            userId: string
            hasExperience: string
            experiences: unknown[]
        }) => {
            const res = await fetch("/api/experience", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            if (!res.ok) {
                const json = await res.json()
                throw new Error(json?.error ?? "Failed to update experience")
            }
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["me"] })
            setShowSuccess(true)
        },
    })

    const { data: degrees = [] } = useDegrees()

    const [isEditing, setIsEditing] = useState(false)
    const [activeTab, setActiveTab] = useState<StudentTab>("student-details")
    const [editingSection, setEditingSection] = useState<EditSection | null>(null)
    const form = useForm({
        defaultValues: getProfileFormValues(user),
        onSubmit: async ({ value }) => {
            const fd = new FormData()
            Object.entries(value).forEach(([key, val]) => {
                let finalKey = key
                if (key === "avatar") finalKey = "avatar"

                if (finalKey === "avatar") {
                    if (val instanceof File) fd.append(finalKey, val)
                } else if (
                    val !== null &&
                    val !== undefined &&
                    val !== "" &&
                    key !== "academics" &&
                    key !== "experiences" &&
                    key !== "academicGap" &&
                    key !== "hasExperience" &&
                    key !== "avatar"
                ) {
                    fd.append(finalKey, String(val))
                }
            })
            await mutation.mutateAsync(fd)
            setIsEditing(false)
        },
    })

    useEffect(() => {
        if (!user || editingSection) return
        form.reset(getProfileFormValues(user))
    }, [user, editingSection, form])

    const cancelEditing = () => {
        form.reset(getProfileFormValues(user))
        setEditingSection(null)
        setIsEditing(false)
    }

    const startEditingSection = (section: EditSection) => {
        form.reset(getProfileFormValues(user))
        setEditingSection(section)
    }

    const saveBasicInfo = async () => {
        const value = form.state.values
        const fd = buildStudentProfileFormData(value, user)
        await mutation.mutateAsync(fd)
        setEditingSection(null)
    }

    const saveStudentDetails = async () => {
        const value = form.state.values
        const fd = buildStudentProfileFormData(value, user, {
            address: value.address,
            zip_code: value.zip_code,
        })
        await mutation.mutateAsync(fd)
        setEditingSection(null)
    }

    const saveAcademics = async () => {
        const value = form.state.values
        await academicMutation.mutateAsync({
            userId: user.id,
            academics: value.academics.map((a: AcademicFormItem) => ({
                qualification: a.qualification,
                instituteName: a.instituteName,
                grade_type: a.grade_type,
                gpa: a.grade_type === "gpa" ? parseFloat(a.gpa) : null,
                obtained_marks: a.grade_type === "percentage" ? parseFloat(a.obtained_marks) : null,
                total_marks: a.grade_type === "percentage" ? parseFloat(a.total_marks) : null,
                start_date: a.start_date || undefined,
                end_date: a.end_date || undefined,
                about: a.about,
            })),
        })
        await queryClient.refetchQueries({ queryKey: ["me"] })
        setEditingSection(null)
    }

    const saveExperience = async () => {
        const value = form.state.values
        await experienceMutation.mutateAsync({
            userId: user.id,
            hasExperience: value.hasExperience,
            experiences: value.experiences,
        })
        setEditingSection(null)
    }

    if (isLoading) return <PageLoader label="Loading your profile..." />
    if (isError) return <ErrorView message="Failed to load profile. Please try again." />

    const role = user?.role
    const isStudent = role === "STUDENT"
    const isEditingBasic = isStudent ? editingSection === "basic" : isEditing
    const isEditingStudentDetails = editingSection === "student-details"
    const isEditingAcademic = editingSection === "academic"
    const isEditingExperience = editingSection === "experience"

    const handleTabChange = (tab: StudentTab) => {
        if (editingSection) {
            form.reset(getProfileFormValues(user))
            setEditingSection(null)
        }
        setActiveTab(tab)
    }

    return (
        <main className="mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white/10 p-6 rounded-2xl border border-white/20 backdrop-blur-sm">
                <div className="space-y-2">
                    <Typography as="h2" font="sub-heading" className="text-2xl sm:text-3xl font-bold tracking-tight">
                        My Profile
                    </Typography>
                    <Typography as="p" font="sub-text" className="text-gray-500 font-medium leading-relaxed">
                        Manage your personal information and academic background.
                    </Typography>
                </div>
                {!isStudent && !isEditing && (
                    <ProfileEditButton onClick={() => setIsEditing(true)} />
                )}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }} className="space-y-8">
                {/* ── Basic Profile Section ── */}
                <BluryCard isCentered={false} childClass="space-y-8" className="rounded-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/20 pb-4">
                        <div className="flex items-center gap-3">
                            <User className="size-5 text-gray-700" />
                            <Typography font="title">Basic Information</Typography>
                        </div>
                        {isStudent && editingSection === null && (
                            <ProfileEditButton onClick={() => startEditingSection("basic")} />
                        )}
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start text-center lg:text-left">
                        <div className="shrink-0 w-full lg:w-auto flex justify-center lg:block">
                            <form.Field name="avatar">
                                {(field) => (
                                    <div className="relative group">
                                        <ImageUploadCard
                                            value={field.state.value ?? (user?.avatarUrl || null)}
                                            onChange={(file) => field.handleChange(file as File)}
                                            message="Upload Photo"
                                            disabled={!isEditingBasic}
                                            className={cn(
                                                "size-40 sm:size-48 overflow-hidden border-4 border-white/40 shadow-xl rounded-2xl transition-all duration-300",
                                                isEditingBasic ? "group-hover:border-brand-byzantine/50 group-hover:shadow-brand-byzantine/20" : "opacity-90 pointer-events-none"
                                            )}
                                        />
                                        {isEditingBasic && (
                                            <div className="absolute -bottom-2 -right-2 bg-brand-byzantine text-white p-2 rounded-lg shadow-lg">
                                                <Edit2 size={16} />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </form.Field>
                        </div>
 
                        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 lg:gap-y-6">
                            <form.Field name="title">
                                {(field) => (
                                    <F field={field} label="Title">
                                        {isEditingBasic ? (
                                            <Select
                                                value={field.state.value || undefined}
                                                onValueChange={(v) => {
                                                    field.handleChange(v)
                                                    const mappedGender = genderFromTitle(v)
                                                    if (mappedGender) {
                                                        field.form.setFieldValue("gender", mappedGender)
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="h-12 bg-white/50 border-white/20"><SelectValue placeholder="Select Title" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Mr">Mr</SelectItem>
                                                    <SelectItem value="Mrs">Mrs</SelectItem>
                                                    <SelectItem value="Ms">Ms</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="p-3 bg-white/20 rounded-xl border border-white/20 min-h-12 flex items-center shadow-sm">
                                                <Typography className="text-gray-800 font-semibold">{field.state.value || "N/A"}</Typography>
                                            </div>
                                        )}
                                    </F>
                                )}
                            </form.Field>
                            <form.Field name="firstName">
                                {(field) => (
                                    <F field={field} label="First Name">
                                        {isEditingBasic ? (
                                            <Input
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                placeholder="Enter your first name"
                                                className="h-12 bg-white/50 border-white/20 focus:bg-white"
                                            />
                                        ) : (
                                            <div className="p-3 bg-white/20 rounded-xl border border-white/20 min-h-12 flex items-center shadow-sm">
                                                <Typography className="text-gray-800 font-semibold">{field.state.value || "N/A"}</Typography>
                                            </div>
                                        )}
                                    </F>
                                )}
                            </form.Field>

                            <form.Field name="lastName">
                                {(field) => (
                                    <F field={field} label="Last Name">
                                        {isEditingBasic ? (
                                            <Input
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                placeholder="Enter your last name"
                                                className="h-12 bg-white/50 border-white/20 focus:bg-white"
                                            />
                                        ) : (
                                            <div className="p-3 bg-white/20 rounded-xl border border-white/20 min-h-12 flex items-center shadow-sm">
                                                <Typography className="text-gray-800 font-semibold">{field.state.value || "N/A"}</Typography>
                                            </div>
                                        )}
                                    </F>
                                )}
                            </form.Field>
 
                            <div className="space-y-2 text-left">
                                <FieldLabel>Email Address</FieldLabel>
                                <div className="p-3 bg-gray-100/50 rounded-xl border border-dashed border-gray-300 min-h-12 flex items-center cursor-not-allowed">
                                    <Typography className="text-gray-500 font-medium">{user?.email}</Typography>
                                </div>
                            </div>
 
                            <form.Field name="phone">
                                {(field) => (
                                    <F field={field} label="Phone Number">
                                        {isEditingBasic ? (
                                            <PhoneInputComponent
                                                value={field.state.value}
                                                onChange={(value) => field.handleChange(value)}
                                                placeholder="Enter your phone number"
                                            />
                                        ) : (
                                            <div className="p-3 bg-white/20 rounded-xl border border-white/20 min-h-12 flex items-center shadow-sm">
                                                <Typography className="text-gray-800 font-semibold">{field.state.value || "N/A"}</Typography>
                                            </div>
                                        )}
                                    </F>
                                )}
                            </form.Field>
 
                            <form.Field name="date_of_birth">
                                {(field) => (
                                    <F field={field} label="Date of Birth">
                                        {isEditingBasic ? (
                                            <DatePicker
                                                value={field.state.value}
                                                onChange={(v) => field.handleChange(v)}
                                                placeholder="Select DOB"
                                            />
                                        ) : (
                                            <div className="p-3 bg-white/20 rounded-xl border border-white/20 min-h-12 flex items-center shadow-sm">
                                                <Typography className="text-gray-800 font-semibold">{field.state.value || "N/A"}</Typography>
                                            </div>
                                        )}
                                    </F>
                                )}
                            </form.Field>
 
                            <form.Field name="gender">
                                {(field) => (
                                    <form.Subscribe selector={(s) => s.values.title}>
                                        {(title) => {
                                            const derivedGender =
                                                genderFromTitle(String(title ?? "")) ??
                                                field.state.value?.toUpperCase()
                                            return (
                                    <F field={field} label="Gender">
                                        {isEditingBasic ? (
                                            <Select
                                                value={derivedGender || undefined}
                                                disabled
                                            >
                                                <SelectTrigger className="h-12 bg-white/50 border-white/20 opacity-100"><SelectValue placeholder="Select title first" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="MALE">Male</SelectItem>
                                                    <SelectItem value="FEMALE">Female</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="p-3 bg-white/20 rounded-xl border border-white/20 min-h-12 flex items-center shadow-sm">
                                                <Typography className="text-gray-800 font-semibold">{formatGenderLabel(derivedGender)}</Typography>
                                            </div>
                                        )}
                                    </F>
                                            )
                                        }}
                                    </form.Subscribe>
                                )}
                            </form.Field>
                        </div>
                    </div>

                    {isStudent && isEditingBasic && (
                        <form.Subscribe selector={(s) => [s.isDirty, s.isSubmitting]}>
                            {([isDirty, isSubmitting]) => (
                                <SectionSaveActions
                                    onCancel={cancelEditing}
                                    onSave={() => void saveBasicInfo()}
                                    isSaving={isSubmitting || mutation.isPending}
                                    isDirty={isDirty}
                                />
                            )}
                        </form.Subscribe>
                    )}
                </BluryCard>

                {/* ── Role Specific Sections ── */}

                {role === "STUDENT" && (
                    <BluryCard isCentered={false} childClass="space-y-8" className="rounded-2xl">
                        <div className="flex flex-wrap gap-2 border-b border-white/20 pb-4">
                            {STUDENT_TABS.map((tab) => {
                                const Icon = tab.icon
                                const isActive = activeTab === tab.id
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => handleTabChange(tab.id)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-brand-byzantine text-white shadow-sm"
                                                : "bg-white/30 text-gray-700 hover:bg-white/50"
                                        )}
                                    >
                                        <Icon size={16} />
                                        <Typography as="span" className="text-inherit font-medium">
                                            {tab.label}
                                        </Typography>
                                    </button>
                                )
                            })}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                            <div className="flex items-center gap-3">
                                {(() => {
                                    const current = STUDENT_TABS.find((t) => t.id === activeTab)!
                                    const Icon = current.icon
                                    return (
                                        <>
                                            <Icon className="size-5 text-gray-700" />
                                            <Typography font="title">{current.label}</Typography>
                                        </>
                                    )
                                })()}
                            </div>
                            {editingSection === null && (
                                <ProfileEditButton onClick={() => startEditingSection(activeTab)} />
                            )}
                        </div>

                        {activeTab === "student-details" && (
                        <div className="space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <FieldLabel>Student ID / Code</FieldLabel>
                                <div className="p-3 bg-gray-100/30 rounded-lg border border-white/5 min-h-12 flex items-center cursor-not-allowed">
                                    <Typography className="text-gray-500 font-medium">{user?.profile?.student_code || "N/A"}</Typography>
                                </div>
                            </div>
                            <form.Field name="nationality">
                                {(field) => (
                                    <F field={field} label="Nationality">
                                        {isEditingStudentDetails ? (
                                            <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="Enter your nationality" />
                                        ) : (
                                            <div className="p-3 bg-white/10 rounded-lg border border-white/5 min-h-12 flex items-center">
                                                <Typography className="text-gray-800 font-medium">{field.state.value || "N/A"}</Typography>
                                            </div>
                                        )}
                                    </F>
                                )}
                            </form.Field>
                            <form.Field name="country">
                                {(field) => (
                                    <F field={field} label="Country">
                                        {isEditingStudentDetails ? (
                                            <CountrySelect value={field.state.value} onValueChange={field.handleChange} />
                                        ) : (
                                            <div className="p-3 bg-white/10 rounded-lg border border-white/5 min-h-12 flex items-center">
                                                <Typography className="text-gray-800 font-medium">{field.state.value || "N/A"}</Typography>
                                            </div>
                                        )}
                                    </F>
                                )}
                            </form.Field>
                            <form.Field name="state">
                                {(field) => (
                                    <F field={field} label="State">
                                        {isEditingStudentDetails ? (
                                            <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="Enter your state" />
                                        ) : (
                                            <div className="p-3 bg-white/10 rounded-lg border border-white/5 min-h-12 flex items-center">
                                                <Typography className="text-gray-800 font-medium">{field.state.value || "N/A"}</Typography>
                                            </div>
                                        )}
                                    </F>
                                )}
                            </form.Field>
                            <form.Field name="city">
                                {(field) => (
                                    <F field={field} label="City">
                                        {isEditingStudentDetails ? (
                                            <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="Enter your city" />
                                        ) : (
                                            <div className="p-3 bg-white/10 rounded-lg border border-white/5 min-h-12 flex items-center">
                                                <Typography className="text-gray-800 font-medium">{field.state.value || "N/A"}</Typography>
                                            </div>
                                        )}
                                    </F>
                                )}
                            </form.Field>
                            <div className="col-span-1 sm:col-span-2">
                                <form.Field name="address">
                                    {(field) => (
                                        <F field={field} label="Full Address">
                                            {isEditingStudentDetails ? (
                                                <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="Enter your Full Address" />
                                            ) : (
                                                <div className="p-3 bg-white/10 rounded-lg border border-white/5 min-h-12 flex items-center">
                                                    <Typography className="text-gray-800 font-medium">{field.state.value || "N/A"}</Typography>
                                                </div>
                                            )}
                                        </F>
                                    )}
                                </form.Field>
                            </div>
                            <form.Field name="zip_code">
                                {(field) => (
                                    <F field={field} label="Zip Code">
                                        {isEditingStudentDetails ? (
                                            <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="Enter your Zip Code" />
                                        ) : (
                                            <div className="p-3 bg-white/10 rounded-lg border border-white/5 min-h-12 flex items-center">
                                                <Typography className="text-gray-800 font-medium">{field.state.value || "N/A"}</Typography>
                                            </div>
                                        )}
                                    </F>
                                )}
                            </form.Field>
                            <form.Field name="guardian_email">
                                {(field) => (
                                    <F field={field} label="Guardian Email">
                                        {isEditingStudentDetails ? (
                                            <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="Enter your Guardian Email" />
                                        ) : (
                                            <div className="p-3 bg-white/10 rounded-lg border border-white/5 min-h-12 flex items-center">
                                                <Typography className="text-gray-800 font-medium">{field.state.value || "N/A"}</Typography>
                                            </div>
                                        )}
                                    </F>
                                )}
                            </form.Field>
                            <form.Field name="guardian_phone">
                                {(field) => (
                                    <F field={field} label="Guardian Phone">
                                        {isEditingStudentDetails ? (
                                            <PhoneInputComponent
                                                value={field.state.value}
                                                onChange={(value) => field.handleChange(value)}
                                                placeholder="Enter your Guardian Phone"
                                            />
                                        ) : (
                                            <div className="p-3 bg-white/10 rounded-lg border border-white/5 min-h-12 flex items-center">
                                                <Typography className="text-gray-800 font-medium">{field.state.value || "N/A"}</Typography>
                                            </div>
                                        )}
                                    </F>
                                )}
                            </form.Field>
                        </div>
                        {isEditingStudentDetails && (
                            <form.Subscribe selector={(s) => [s.isDirty, s.isSubmitting]}>
                                {([isDirty, isSubmitting]) => (
                                    <SectionSaveActions
                                        onCancel={cancelEditing}
                                        onSave={() => void saveStudentDetails()}
                                        isSaving={isSubmitting || mutation.isPending}
                                        isDirty={isDirty}
                                    />
                                )}
                            </form.Subscribe>
                        )}
                        </div>
                        )}

                        {activeTab === "academic" && (
                        <div className="space-y-6">
                            {/* {isEditingAcademic && (
                                <div className="flex justify-end">
                                <form.Field name="academics">
                                    {(field) => (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="w-full sm:w-auto gap-2 border border-brand-byzantine text-brand-byzantine hover:bg-brand-byzantine/5"
                                            onClick={() => {
                                                const current = field.state.value || []
                                                field.handleChange([...current, {
                                                    qualification: "",
                                                    instituteName: "",
                                                    obtained_marks: "",
                                                    total_marks: "",
                                                    start_date: "",
                                                    end_date: "",
                                                    about: ""
                                                }])
                                            }}
                                        >
                                            <Plus size={16} /> Add Qualification
                                        </Button>
                                    )}
                                </form.Field>
                                </div>
                            )} */}

                        <form.Field name="academics">
                            {(field) => (
                                <div className="space-y-6">
                                    {(field.state.value || []).map((item: AcademicFormItem, index: number) => {
                                        const isGpa = item.grade_type === "gpa"
                                        const percentage = computePercentage(item.obtained_marks, item.total_marks)
                                        const savedAcademic = user?.academic?.[index]
                                        const startDate = item.start_date || normalizeDateValue(savedAcademic?.start_date)
                                        const endDate = item.end_date || normalizeDateValue(savedAcademic?.end_date)
                                        return (
                                        <div key={index} className="relative p-6 bg-white/20 rounded-xl border border-white/30 space-y-4">
                                            {isEditingAcademic && (
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    className="absolute top-4 right-4 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => {
                                                        const current = [...field.state.value]
                                                        current.splice(index, 1)
                                                        field.handleChange(current)
                                                    }}
                                                >
                                                    <Trash2 size={18} />
                                                </Button>
                                            )}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {/* Highest Degree */}
                                                <div className="space-y-2">
                                                    <FieldLabel>Highest Degree</FieldLabel>
                                                    {isEditingAcademic ? (
                                                        <Select
                                                            value={item.qualification}
                                                            onValueChange={(v) => {
                                                                const current = [...field.state.value]
                                                                current[index].qualification = v
                                                                field.handleChange(current)
                                                            }}
                                                        >
                                                            <SelectTrigger><SelectValue placeholder="Select highest degree" /></SelectTrigger>
                                                            <SelectContent>
                                                                {degrees.map((degree) => (
                                                                    <SelectItem key={degree.id} value={degree.id}>
                                                                        {formatDegreeLabel(degree)}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <Typography className="p-3 bg-white/10 rounded-lg font-medium">
                                                            {degrees.find((d) => d.id === item.qualification)
                                                                ? formatDegreeLabel(degrees.find((d) => d.id === item.qualification)!)
                                                                : "N/A"}
                                                        </Typography>
                                                    )}
                                                </div>
                                                {/* Institute */}
                                                <div className="space-y-2">
                                                    <FieldLabel>Institute Name</FieldLabel>
                                                    {isEditingAcademic ? (
                                                        <Input
                                                            value={item.instituteName}
                                                            onChange={(e) => {
                                                                const current = [...field.state.value]
                                                                current[index].instituteName = e.target.value
                                                                field.handleChange(current)
                                                            }}
                                                            placeholder="University of..."
                                                        />
                                                    ) : (
                                                        <Typography className="p-3 bg-white/10 rounded-lg font-medium">{item.instituteName || "N/A"}</Typography>
                                                    )}
                                                </div>
                                                {/* Grade Type */}
                                                <div className="space-y-2">
                                                    <FieldLabel>Grade Type</FieldLabel>
                                                    {isEditingAcademic ? (
                                                        <Select
                                                            value={item.grade_type}
                                                            onValueChange={(v: "percentage" | "gpa") => {
                                                                const current = [...field.state.value]
                                                                current[index] = {
                                                                    ...current[index],
                                                                    grade_type: v,
                                                                    gpa: v === "percentage" ? "" : current[index].gpa,
                                                                    obtained_marks: v === "gpa" ? "" : current[index].obtained_marks,
                                                                    total_marks: v === "gpa" ? "" : current[index].total_marks,
                                                                }
                                                                field.handleChange(current)
                                                            }}
                                                        >
                                                            <SelectTrigger><SelectValue placeholder="Select grade type" /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="percentage">Percentage</SelectItem>
                                                                <SelectItem value="gpa">GPA</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <Typography className="p-3 bg-white/10 rounded-lg font-medium">
                                                            {isGpa ? "GPA" : "Percentage"}
                                                        </Typography>
                                                    )}
                                                </div>
                                                {isGpa ? (
                                                    <div className="space-y-2">
                                                        <FieldLabel>GPA</FieldLabel>
                                                        {isEditingAcademic ? (
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                max="4"
                                                                value={item.gpa}
                                                                onChange={(e) => {
                                                                    const current = [...field.state.value]
                                                                    current[index].gpa = e.target.value
                                                                    field.handleChange(current)
                                                                }}
                                                                placeholder="3.50"
                                                                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            />
                                                        ) : (
                                                            <Typography className="p-3 bg-white/10 rounded-lg font-medium">
                                                                {item.gpa || "N/A"}
                                                            </Typography>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="space-y-2">
                                                            <FieldLabel>Percentage</FieldLabel>
                                                            <Typography className="p-3 bg-white/10 rounded-lg font-medium">
                                                                {percentage ?? "N/A"}
                                                            </Typography>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <FieldLabel>Obtained Marks</FieldLabel>
                                                            {isEditingAcademic ? (
                                                                <Input
                                                                    type="number"
                                                                    value={item.obtained_marks}
                                                                    onKeyDown={(e) => ["e", "E", "-", "+", "."].includes(e.key) && e.preventDefault()}
                                                                    onChange={(e) => {
                                                                        const current = [...field.state.value]
                                                                        current[index].obtained_marks = e.target.value
                                                                        field.handleChange(current)
                                                                    }}
                                                                    placeholder="850"
                                                                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                />
                                                            ) : (
                                                                <Typography className="p-3 bg-white/10 rounded-lg font-medium">{item.obtained_marks || "N/A"}</Typography>
                                                            )}
                                                        </div>
                                                        <div className="space-y-2">
                                                            <FieldLabel>Total Marks</FieldLabel>
                                                            {isEditingAcademic ? (
                                                                <Input
                                                                    type="number"
                                                                    value={item.total_marks}
                                                                    onKeyDown={(e) => ["e", "E", "-", "+", "."].includes(e.key) && e.preventDefault()}
                                                                    onChange={(e) => {
                                                                        const current = [...field.state.value]
                                                                        current[index].total_marks = e.target.value
                                                                        field.handleChange(current)
                                                                    }}
                                                                    placeholder="1100"
                                                                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                />
                                                            ) : (
                                                                <Typography className="p-3 bg-white/10 rounded-lg font-medium">{item.total_marks || "N/A"}</Typography>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                                {/* Start Date */}
                                                <div className="space-y-2">
                                                    <FieldLabel>Start Date</FieldLabel>
                                                    {isEditingAcademic ? (
                                                        <DatePicker
                                                            value={startDate}
                                                            onChange={(v) => {
                                                                const current = [...field.state.value]
                                                                current[index].start_date = v
                                                                field.handleChange(current)
                                                            }}
                                                            placeholder="Select Start Date"
                                                        />
                                                    ) : (
                                                        <Typography className="p-3 bg-white/10 rounded-lg font-medium">{startDate || "N/A"}</Typography>
                                                    )}
                                                </div>
                                                {/* End Date */}
                                                <div className="space-y-2">
                                                    <FieldLabel>End Date</FieldLabel>
                                                    {isEditingAcademic ? (
                                                        <DatePicker
                                                            value={endDate}
                                                            onChange={(v) => {
                                                                const current = [...field.state.value]
                                                                current[index].end_date = v
                                                                field.handleChange(current)
                                                            }}
                                                            placeholder="Select End Date"
                                                        />
                                                    ) : (
                                                        <Typography className="p-3 bg-white/10 rounded-lg font-medium">{endDate || "N/A"}</Typography>
                                                    )}
                                                </div>
                                                {/* About */}
                                                <div className="col-span-1 sm:col-span-2 lg:col-span-3 space-y-2">
                                                    <FieldLabel>Honors / Achievements</FieldLabel>
                                                    {isEditingAcademic ? (
                                                        <textarea
                                                            className="w-full min-h-[80px] p-3 rounded-lg bg-white/50 border border-border focus:ring-1 focus:ring-purple-400 outline-none transition-all"
                                                            value={item.about}
                                                            onChange={(e) => {
                                                                const current = [...field.state.value]
                                                                current[index].about = e.target.value
                                                                field.handleChange(current)
                                                            }}
                                                            placeholder="Dean's list, Scholarships, etc."
                                                        />
                                                    ) : (
                                                        <Typography className="p-3 bg-white/10 rounded-lg font-medium whitespace-pre-wrap">{item.about || "N/A"}</Typography>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        )
                                    })}
                                    {(field.state.value || []).length === 0 && (
                                        <div className="text-center py-12 bg-white/10 rounded-xl border border-dashed border-white/30">
                                            <Typography className="text-gray-500">No qualifications added yet.</Typography>
                                        </div>
                                    )}
                                </div>
                            )}
                        </form.Field>
                        {isEditingAcademic && (
                            <>
                                {academicMutation.isError && (
                                    <ErrorView message={academicMutation.error instanceof Error ? academicMutation.error.message : "Something went wrong"} />
                                )}
                                <form.Subscribe selector={(s) => [s.isDirty, s.isSubmitting]}>
                                    {([isDirty, isSubmitting]) => (
                                        <SectionSaveActions
                                            onCancel={cancelEditing}
                                            onSave={() => void saveAcademics()}
                                            isSaving={isSubmitting || academicMutation.isPending}
                                            isDirty={isDirty}
                                        />
                                    )}
                                </form.Subscribe>
                            </>
                        )}
                        </div>
                        )}

                        {activeTab === "experience" && (
                        <div className="space-y-6">
                            {isEditingExperience && (
                                <div className="flex justify-end">
                                <form.Field name="experiences">
                                    {(field) => (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="w-full sm:w-auto gap-2 border border-brand-byzantine text-brand-byzantine hover:bg-brand-byzantine/5"
                                            onClick={() => {
                                                const current = field.state.value || []
                                                field.handleChange([...current, {
                                                    name: "",
                                                    organization: "",
                                                    industry: "",
                                                    country: "",
                                                    startDate: "",
                                                    endDate: "",
                                                    responsibility: ""
                                                }])
                                                form.setFieldValue("hasExperience", "yes")
                                            }}
                                        >
                                            <Plus size={16} /> Add Experience
                                        </Button>
                                    )}
                                </form.Field>
                                </div>
                            )}

                        <form.Field name="experiences">
                            {(field) => (
                                <div className="space-y-6">
                                    {(field.state.value || []).map((item: any, index: number) => (
                                        <div key={index} className="relative p-6 bg-white/20 rounded-xl border border-white/30 space-y-4">
                                            {isEditingExperience && (
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    className="absolute top-4 right-4 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => {
                                                        const current = [...field.state.value]
                                                        current.splice(index, 1)
                                                        field.handleChange(current)
                                                        if (current.length === 0) {
                                                            form.setFieldValue("hasExperience", "no")
                                                        }
                                                    }}
                                                >
                                                    <Trash2 size={18} />
                                                </Button>
                                            )}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <FieldLabel>Job Title</FieldLabel>
                                                    {isEditingExperience ? (
                                                        <Input
                                                            value={item.name}
                                                            onChange={(e) => {
                                                                const current = [...field.state.value]
                                                                current[index].name = e.target.value
                                                                field.handleChange(current)
                                                            }}
                                                            placeholder="Software Engineer"
                                                        />
                                                    ) : (
                                                        <Typography className="p-3 bg-white/10 rounded-lg font-medium">{item.name || "N/A"}</Typography>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <FieldLabel>Organization</FieldLabel>
                                                    {isEditingExperience ? (
                                                        <Input
                                                            value={item.organization}
                                                            onChange={(e) => {
                                                                const current = [...field.state.value]
                                                                current[index].organization = e.target.value
                                                                field.handleChange(current)
                                                            }}
                                                            placeholder="Google"
                                                        />
                                                    ) : (
                                                        <Typography className="p-3 bg-white/10 rounded-lg font-medium">{item.organization || "N/A"}</Typography>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <FieldLabel>Industry</FieldLabel>
                                                    {isEditingExperience ? (
                                                        <Input
                                                            value={item.industry}
                                                            onChange={(e) => {
                                                                const current = [...field.state.value]
                                                                current[index].industry = e.target.value
                                                                field.handleChange(current)
                                                            }}
                                                            placeholder="Technology"
                                                        />
                                                    ) : (
                                                        <Typography className="p-3 bg-white/10 rounded-lg font-medium">{item.industry || "N/A"}</Typography>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <FieldLabel>Country</FieldLabel>
                                                    {isEditingExperience ? (
                                                        <CountrySelect
                                                            value={item.country}
                                                            onValueChange={(v) => {
                                                                const current = [...field.state.value]
                                                                current[index].country = v
                                                                field.handleChange(current)
                                                            }}
                                                        />
                                                    ) : (
                                                        <Typography className="p-3 bg-white/10 rounded-lg font-medium">{item.country || "N/A"}</Typography>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <FieldLabel>Start Date</FieldLabel>
                                                    {isEditingExperience ? (
                                                        <DatePicker
                                                            value={item.startDate}
                                                            onChange={(v) => {
                                                                const current = [...field.state.value]
                                                                current[index].startDate = v
                                                                field.handleChange(current)
                                                            }}
                                                            placeholder="Select Start Date"
                                                        />
                                                    ) : (
                                                        <Typography className="p-3 bg-white/10 rounded-lg font-medium">{item.startDate || "N/A"}</Typography>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <FieldLabel>End Date</FieldLabel>
                                                    {isEditingExperience ? (
                                                        <DatePicker
                                                            value={item.endDate}
                                                            onChange={(v) => {
                                                                const current = [...field.state.value]
                                                                if (current[index].startDate && v < current[index].startDate) {
                                                                    return
                                                                }
                                                                current[index].endDate = v
                                                                field.handleChange(current)
                                                            }}
                                                            placeholder="Select End Date"
                                                        />
                                                    ) : (
                                                        <Typography className="p-3 bg-white/10 rounded-lg font-medium">{item.endDate || "N/A"}</Typography>
                                                    )}
                                                </div>
                                                <div className="col-span-1 sm:col-span-2 lg:col-span-3 space-y-2">
                                                    <FieldLabel>Responsibilities</FieldLabel>
                                                    {isEditingExperience ? (
                                                        <textarea
                                                            className="w-full min-h-[80px] p-3 rounded-lg bg-white/50 border border-border focus:ring-1 focus:ring-purple-400 outline-none transition-all"
                                                            value={item.responsibility}
                                                            onChange={(e) => {
                                                                const current = [...field.state.value]
                                                                current[index].responsibility = e.target.value
                                                                field.handleChange(current)
                                                            }}
                                                            placeholder="Built scalable systems..."
                                                        />
                                                    ) : (
                                                        <Typography className="p-3 bg-white/10 rounded-lg font-medium whitespace-pre-wrap">{item.responsibility || "N/A"}</Typography>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(field.state.value || []).length === 0 && (
                                        <div className="text-center py-12 bg-white/10 rounded-xl border border-dashed border-white/30">
                                            <Typography className="text-gray-500">No work experience added yet.</Typography>
                                        </div>
                                    )}
                                </div>
                            )}
                        </form.Field>
                        {isEditingExperience && (
                            <form.Subscribe selector={(s) => [s.isDirty, s.isSubmitting]}>
                                {([isDirty, isSubmitting]) => (
                                    <SectionSaveActions
                                        onCancel={cancelEditing}
                                        onSave={() => void saveExperience()}
                                        isSaving={isSubmitting || experienceMutation.isPending}
                                        isDirty={isDirty}
                                    />
                                )}
                            </form.Subscribe>
                        )}
                        </div>
                        )}
                    </BluryCard>
                )}

                {role === "AGENT" && (
                    <BluryCard isCentered={false} childClass="space-y-8" className="rounded-2xl">
                        <div className="flex items-center gap-3 border-b border-white/20 pb-4">
                            <Briefcase className="size-5 text-gray-700" />
                            <Typography font="title">Agent Information</Typography>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <form.Field name="contact_person_first_name">
                                {(field) => (
                                    <F field={field} label="Contact Person First Name">
                                        {isEditing ? (
                                            <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="Enter first name" />
                                        ) : (
                                            <div className="p-3 bg-white/10 rounded-lg border border-white/5 min-h-12 flex items-center">
                                                <Typography className="text-gray-800 font-medium">{field.state.value || "N/A"}</Typography>
                                            </div>
                                        )}
                                    </F>
                                )}
                            </form.Field>
                            <form.Field name="contact_person_last_name">
                                {(field) => (
                                    <F field={field} label="Contact Person Last Name">
                                        {isEditing ? (
                                            <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="Enter last name" />
                                        ) : (
                                            <div className="p-3 bg-white/10 rounded-lg border border-white/5 min-h-12 flex items-center">
                                                <Typography className="text-gray-800 font-medium">{field.state.value || "N/A"}</Typography>
                                            </div>
                                        )}
                                    </F>
                                )}
                            </form.Field>
                            <form.Field name="nationality">
                                {(field) => (
                                    <F field={field} label="Nationality">
                                        {isEditing ? (
                                            <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="Enter your Nationality" />
                                        ) : (
                                            <div className="p-3 bg-white/10 rounded-lg border border-white/5 min-h-12 flex items-center">
                                                <Typography className="text-gray-800 font-medium">{field.state.value || "N/A"}</Typography>
                                            </div>
                                        )}
                                    </F>
                                )}
                            </form.Field>
                            <form.Field name="website">
                                {(field) => (
                                    <F field={field} label="Website">
                                        {isEditing ? (
                                            <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="Enter your Website" />
                                        ) : (
                                            <div className="p-3 bg-white/10 rounded-lg border border-white/5 min-h-12 flex items-center">
                                                <Typography className="text-gray-800 font-medium">{field.state.value || "N/A"}</Typography>
                                            </div>
                                        )}
                                    </F>
                                )}
                            </form.Field>
                            <form.Field name="experience_years">
                                {(field) => (
                                    <F field={field} label="Experience (Years)">
                                        {isEditing ? (
                                            <Input
                                                type="number"
                                                min={0}
                                                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                value={field.state.value}
                                                onChange={(e) => {
                                                    const parsed = Number(e.target.value)
                                                    field.handleChange(
                                                        e.target.value === ""
                                                            ? ""
                                                            : String(Math.max(0, Number.isNaN(parsed) ? 0 : parsed))
                                                    )
                                                }}
                                                placeholder="5"
                                            />
                                        ) : (
                                            <div className="p-3 bg-white/10 rounded-lg border border-white/5 min-h-12 flex items-center">
                                                <Typography className="text-gray-800 font-medium">{field.state.value || "0"}</Typography>
                                            </div>
                                        )}
                                    </F>
                                )}
                            </form.Field>
                            <form.Field name="country">
                                {(field) => (
                                    <F field={field} label="Country">
                                        {isEditing ? (
                                            <CountrySelect value={field.state.value} onValueChange={field.handleChange} />
                                        ) : (
                                            <div className="p-3 bg-white/10 rounded-lg border border-white/5 min-h-12 flex items-center">
                                                <Typography className="text-gray-800 font-medium">{field.state.value || "N/A"}</Typography>
                                            </div>
                                        )}
                                    </F>
                                )}
                            </form.Field>
                            <form.Field name="state">
                                {(field) => (
                                    <F field={field} label="State">
                                        {isEditing ? (
                                            <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="Enter your state" />
                                        ) : (
                                            <div className="p-3 bg-white/10 rounded-lg border border-white/5 min-h-12 flex items-center">
                                                <Typography className="text-gray-800 font-medium">{field.state.value || "N/A"}</Typography>
                                            </div>
                                        )}
                                    </F>
                                )}
                            </form.Field>
                            <form.Field name="city">
                                {(field) => (
                                    <F field={field} label="City">
                                        {isEditing ? (
                                            <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="Enter your city" />
                                        ) : (
                                            <div className="p-3 bg-white/10 rounded-lg border border-white/5 min-h-12 flex items-center">
                                                <Typography className="text-gray-800 font-medium">{field.state.value || "N/A"}</Typography>
                                            </div>
                                        )}
                                    </F>
                                )}
                            </form.Field>
                            <form.Field name="other_contact_number">
                                {(field) => (
                                    <F field={field} label="Alternate Phone">
                                        {isEditing ? (
                                            <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="Enter your Alternate Phone" />
                                        ) : (
                                            <div className="p-3 bg-white/10 rounded-lg border border-white/5 min-h-12 flex items-center">
                                                <Typography className="text-gray-800 font-medium">{field.state.value || "N/A"}</Typography>
                                            </div>
                                        )}
                                    </F>
                                )}
                            </form.Field>
                            <div className="col-span-1 sm:col-span-2">
                                <form.Field name="address">
                                    {(field) => (
                                        <F field={field} label="Full Address">
                                            {isEditing ? (
                                                <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="Enter your Full Address" />
                                            ) : (
                                                <div className="p-3 bg-white/10 rounded-lg border border-white/5 min-h-12 flex items-center">
                                                    <Typography className="text-gray-800 font-medium">{field.state.value || "N/A"}</Typography>
                                                </div>
                                            )}
                                        </F>
                                    )}
                                </form.Field>
                            </div>
                        </div>
                    </BluryCard>
                )}

                {role === "UNIVERSITY" && (
                    <BluryCard isCentered={false} childClass="space-y-8" className="rounded-2xl">
                        <div className="flex items-center gap-3 border-b border-white/20 pb-4">
                            <Building className="size-5 text-gray-700" />
                            <Typography font="title">University Profile</Typography>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <form.Field name="website">
                                {(field) => (
                                    <F field={field} label="Official Website">
                                        {isEditing ? (
                                            <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="Enter your Official Website" />
                                        ) : (
                                            <div className="p-3 bg-white/10 rounded-lg border border-white/5 min-h-12 flex items-center">
                                                <Typography className="text-gray-800 font-medium">{field.state.value || "N/A"}</Typography>
                                            </div>
                                        )}
                                    </F>
                                )}
                            </form.Field>
                            <form.Field name="country">
                                {(field) => (
                                    <F field={field} label="Country">
                                        {isEditing ? (
                                            <CountrySelect value={field.state.value} onValueChange={field.handleChange} />
                                        ) : (
                                            <div className="p-3 bg-white/10 rounded-lg border border-white/5 min-h-12 flex items-center">
                                                <Typography className="text-gray-800 font-medium">{field.state.value || "N/A"}</Typography>
                                            </div>
                                        )}
                                    </F>
                                )}
                            </form.Field>
                            <form.Field name="state">
                                {(field) => (
                                    <F field={field} label="State">
                                        {isEditing ? (
                                            <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="Enter your state" />
                                        ) : (
                                            <div className="p-3 bg-white/10 rounded-lg border border-white/5 min-h-12 flex items-center">
                                                <Typography className="text-gray-800 font-medium">{field.state.value || "N/A"}</Typography>
                                            </div>
                                        )}
                                    </F>
                                )}
                            </form.Field>
                            <form.Field name="city">
                                {(field) => (
                                    <F field={field} label="City">
                                        {isEditing ? (
                                            <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="Enter your city" />
                                        ) : (
                                            <div className="p-3 bg-white/10 rounded-lg border border-white/5 min-h-12 flex items-center">
                                                <Typography className="text-gray-800 font-medium">{field.state.value || "N/A"}</Typography>
                                            </div>
                                        )}
                                    </F>
                                )}
                            </form.Field>
                            <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                                <form.Field name="address">
                                    {(field) => (
                                        <F field={field} label="Full Address">
                                            {isEditing ? (
                                                <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="Enter your Full Address" />
                                            ) : (
                                                <div className="p-3 bg-white/10 rounded-lg border border-white/5 min-h-12 flex items-center">
                                                    <Typography className="text-gray-800 font-medium">{field.state.value || "N/A"}</Typography>
                                                </div>
                                            )}
                                        </F>
                                    )}
                                </form.Field>
                            </div>
                            <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                                <form.Field name="description">
                                    {(field) => (
                                        <F field={field} label="Description">
                                            {isEditing ? (
                                                <textarea
                                                    className="w-full min-h-[120px] p-3 rounded-lg bg-white/50 border border-border focus:ring-1 focus:ring-purple-400 outline-none transition-all"
                                                    value={field.state.value}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                    placeholder="Enter  description"
                                                />
                                            ) : (
                                                <div className="p-3 bg-white/10 rounded-lg border border-white/5 min-h-[120px]">
                                                    <Typography className="text-gray-800 font-medium whitespace-pre-wrap">{field.state.value || "No description provided."}</Typography>
                                                </div>
                                            )}
                                        </F>
                                    )}
                                </form.Field>
                            </div>
                        </div>
                    </BluryCard>
                )}
 
                {!isStudent && (
                <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4 pb-12">
                    {isEditing && (
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto sm:px-8 py-6 rounded-xl border font-bold border-brand-byzantine text-brand-byzantine hover:bg-brand-byzantine/5 hover:text-brand-byzantine"
                            onClick={cancelEditing}
                        >
                            Cancel
                        </Button>
                    )}
 
                    {isEditing && (
                        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting, s.isDirty]}>
                            {([canSubmit, isSubmitting, isDirty]) => (
                                <Button
                                    type="submit"
                                    className="w-full sm:w-auto sm:px-12 py-6 bg-brand-byzantine hover:bg-brand-byzantine/80"
                                    disabled={!canSubmit || isSubmitting || mutation.isPending || !isDirty}
                                >
                                    {isSubmitting || mutation.isPending ? "Updating..." : "Save Changes"}
                                </Button>
                            )}
                        </form.Subscribe>
                    )}
                </div>
                )}
            </form>

            <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
                <DialogContent className="sm:max-w-md" showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle>Success</DialogTitle>
                        <DialogDescription>
                            Your profile has been updated successfully.
                        </DialogDescription>
                        <Button
                            className="self-end bg-brand-byzantine hover:bg-brand-byzantine/90 text-white w-fit px-8 mt-4"
                            onClick={() => setShowSuccess(false)}
                        >
                            OK
                        </Button>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </main>
    )
}
