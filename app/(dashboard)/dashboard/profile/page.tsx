"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "@tanstack/react-form"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import ImageUploadCard from "@/components/shared/image-upload-card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

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

    const [isEditing, setIsEditing] = useState(false)
    const form = useForm({
        defaultValues: {
            fullName: user?.fullName ?? "",
            phone: user?.phone ?? "",
            date_of_birth: user?.profile?.dateOfBirth ?? "",
            gender: user?.profile?.gender ?? "",
            country: user?.profile?.country ?? "",
            nationality: user?.profile?.nationality ?? "",
            city: user?.profile?.city ?? "",
            address: user?.profile?.address ?? "",
            zip_code: user?.profile?.zip_code ?? "",
            guardian_email: user?.profile?.guardian_email ?? "",
            guardian_phone: user?.profile?.guardian_phone ?? "",
            contact_person_name: user?.profile?.contact_person_name ?? "",
            other_contact_number: user?.profile?.other_contact_number ?? "",
            website: user?.profile?.website ?? "",
            experience_years: user?.profile?.experience_years ?? "0",
            description: user?.profile?.description ?? "",
            avatar: null as File | null,

            // New fields for Student
            academics: user?.academic?.map((a: any) => ({
                qualification: a.highestDegree || "",
                instituteName: a.instituteName || "",
                gpa: a.gpa || "",
                startDate: a.startDate || "",
                endDate: a.endDate || "",
                about: a.about || ""
            })) || [],
            academicGap: user?.experience?.academicGap || "0",
            hasExperience: user?.experience?.hasExperience || "no",
            experiences: user?.experience?.entries?.map((e: any) => ({
                name: e.jobTitle || "",
                organization: e.organization || "",
                industry: e.industry || "",
                country: e.country || "",
                startDate: e.startDate || "",
                endDate: e.endDate || "",
                responsibility: e.responsibilities || ""
            })) || []
        },
        onSubmit: async ({ value }) => {
            // 1. Update Profile
            const fd = new FormData()
            Object.entries(value).forEach(([key, val]) => {
                let finalKey = key
                if (role === "STUDENT") {
                    if (key === "date_of_birth") finalKey = "dob"
                    if (key === "guardian_email") finalKey = "guardianEmail"
                    if (key === "guardian_phone") finalKey = "guardianPhone"
                    if (key === "avatar") {
                        finalKey = "avatar_url"
                        // If no new file, send the current URL to satisfy the schema
                        if (!val && user?.avatarUrl) {
                            fd.append(finalKey, user.avatarUrl)
                            return
                        }
                    }
                    if (key === "gender") {
                        val = String(val).toLowerCase()
                    }
                } else {
                    if (key === "avatar") finalKey = "avatar"
                }

                if (finalKey === "avatar_url" || finalKey === "avatar") {
                    if (val instanceof File) fd.append(finalKey, val)
                } else if (
                    val !== null &&
                    val !== undefined &&
                    val !== "" &&
                    key !== "academics" &&
                    key !== "experiences" &&
                    key !== "academicGap" &&
                    key !== "hasExperience"
                ) {
                    fd.append(finalKey, String(val))
                }
            })
            await mutation.mutateAsync(fd)

            // 2. Update Student Specifics (Academics & Experience)
            if (role === "STUDENT") {
                try {
                    // Update Academic
                    await fetch("/api/academic", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            userId: user.id,
                            academics: value.academics.map((a: any) => ({
                                ...a,
                                gpa: parseFloat(a.gpa) || 0
                            }))
                        })
                    })

                    // Update Experience
                    await fetch("/api/experience", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            userId: user.id,
                            academicGap: parseInt(value.academicGap) || 0,
                            hasExperience: value.hasExperience,
                            experiences: value.experiences
                        })
                    })
                } catch (err) {
                    console.error("Failed to update extra student info", err)
                }
            }

            setIsEditing(false)
        },
    })

    if (isLoading) return <PageLoader label="Loading your profile..." />
    if (isError) return <ErrorView message="Failed to load profile. Please try again." />

    const role = user?.role

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
                {!isEditing && (
                    <Button
                        onClick={() => setIsEditing(true)}
                        className="bg-brand-byzantine hover:bg-brand-byzantine/90 text-white gap-2 h-12 px-6 rounded-xl w-full sm:w-auto shadow-lg shadow-brand-byzantine/20"
                    >
                        <Edit2 size={18} />
                        Edit Profile
                    </Button>
                )}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }} className="space-y-8">
                {/* ── Basic Profile Section ── */}
                <BluryCard isCentered={false} childClass="space-y-8" className="rounded-2xl">
                    <div className="flex items-center gap-3 border-b border-white/20 pb-4">
                        <User className="size-5 text-gray-700" />
                        <Typography font="title">Basic Information</Typography>
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
                                            disabled={!isEditing}
                                            className={cn(
                                                "size-40 sm:size-48 overflow-hidden border-4 border-white/40 shadow-xl rounded-2xl transition-all duration-300",
                                                isEditing ? "group-hover:border-brand-byzantine/50 group-hover:shadow-brand-byzantine/20" : "opacity-90 pointer-events-none"
                                            )}
                                        />
                                        {isEditing && (
                                            <div className="absolute -bottom-2 -right-2 bg-brand-byzantine text-white p-2 rounded-lg shadow-lg">
                                                <Edit2 size={16} />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </form.Field>
                        </div>
 
                        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 lg:gap-y-6">
                            <form.Field name="fullName">
                                {(field) => (
                                    <F field={field} label="Full Name">
                                        {isEditing ? (
                                            <Input
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                placeholder="Enter your full name"
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
                                        {isEditing ? (
                                            <Input
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                placeholder="Enter your phone number"
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
 
                            <form.Field name="date_of_birth">
                                {(field) => (
                                    <F field={field} label="Date of Birth">
                                        {isEditing ? (
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
                                    <F field={field} label="Gender">
                                        {isEditing ? (
                                            <Select
                                                value={field.state.value?.toUpperCase()}
                                                onValueChange={(v) => field.handleChange(v)}
                                            >
                                                <SelectTrigger className="h-12 bg-white/50 border-white/20"><SelectValue placeholder="Select Gender" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="MALE">Male</SelectItem>
                                                    <SelectItem value="FEMALE">Female</SelectItem>
                                                    <SelectItem value="OTHER">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="p-3 bg-white/20 rounded-xl border border-white/20 min-h-12 flex items-center shadow-sm">
                                                <Typography className="text-gray-800 font-semibold uppercase">{field.state.value || "N/A"}</Typography>
                                            </div>
                                        )}
                                    </F>
                                )}
                            </form.Field>
                        </div>
                    </div>
                </BluryCard>

                {/* ── Role Specific Sections ── */}

                {role === "STUDENT" && (
                    <BluryCard isCentered={false} childClass="space-y-8" className="rounded-2xl">
                        <div className="flex items-center gap-3 border-b border-white/20 pb-4">
                            <Globe className="size-5 text-gray-700" />
                            <Typography font="title">Student Details</Typography>
                        </div>
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
                            <form.Field name="country">
                                {(field) => (
                                    <F field={field} label="Country">
                                        {isEditing ? (
                                            <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="Enter your Country" />
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
                                            <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="Enter your City" />
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
                            <form.Field name="zip_code">
                                {(field) => (
                                    <F field={field} label="Zip Code">
                                        {isEditing ? (
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
                                        {isEditing ? (
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
                                        {isEditing ? (
                                            <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="Enter your Guardian Phone" />
                                        ) : (
                                            <div className="p-3 bg-white/10 rounded-lg border border-white/5 min-h-12 flex items-center">
                                                <Typography className="text-gray-800 font-medium">{field.state.value || "N/A"}</Typography>
                                            </div>
                                        )}
                                    </F>
                                )}
                            </form.Field>
                        </div>
                    </BluryCard>
                )}

                {role === "STUDENT" && (
                    <BluryCard isCentered={false} childClass="space-y-8" className="rounded-2xl">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/20 pb-4">
                            <div className="flex items-center gap-3">
                                <GraduationCap className="size-5 text-gray-700" />
                                <Typography font="title">Academic Qualifications</Typography>
                            </div>
                            {isEditing && (
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
                                                    gpa: "",
                                                    startDate: "",
                                                    endDate: "",
                                                    about: ""
                                                }])
                                            }}
                                        >
                                            <Plus size={16} /> Add Qualification
                                        </Button>
                                    )}
                                </form.Field>
                            )}
                        </div>

                        <form.Field name="academics">
                            {(field) => (
                                <div className="space-y-6">
                                    {(field.state.value || []).map((item: any, index: number) => (
                                        <div key={index} className="relative p-6 bg-white/20 rounded-xl border border-white/30 space-y-4">
                                            {isEditing && (
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
                                                <div className="space-y-2">
                                                    <FieldLabel>Qualification / Degree</FieldLabel>
                                                    {isEditing ? (
                                                        <Input
                                                            value={item.qualification}
                                                            onChange={(e) => {
                                                                const current = [...field.state.value]
                                                                current[index].qualification = e.target.value
                                                                field.handleChange(current)
                                                            }}
                                                            placeholder="Bachelor's in CS"
                                                        />
                                                    ) : (
                                                        <Typography className="p-3 bg-white/10 rounded-lg font-medium">{item.qualification || "N/A"}</Typography>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <FieldLabel>Institute Name</FieldLabel>
                                                    {isEditing ? (
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
                                                <div className="space-y-2">
                                                    <FieldLabel>GPA</FieldLabel>
                                                    {isEditing ? (
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={item.gpa}
                                                            onChange={(e) => {
                                                                const current = [...field.state.value]
                                                                current[index].gpa = e.target.value
                                                                field.handleChange(current)
                                                            }}
                                                            placeholder="3.8"
                                                        />
                                                    ) : (
                                                        <Typography className="p-3 bg-white/10 rounded-lg font-medium">{item.gpa || "N/A"}</Typography>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <FieldLabel>Start Date</FieldLabel>
                                                    {isEditing ? (
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
                                                    {isEditing ? (
                                                        <DatePicker
                                                            value={item.endDate}
                                                            onChange={(v) => {
                                                                const current = [...field.state.value]
                                                                if (current[index].startDate && v < current[index].startDate) {
                                                                    // Validation: End Date cannot be before Start Date
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
                                                <div className="col-span-1 sm:col-span-2 lg:col-span-1 space-y-2 opacity-0 pointer-events-none hidden lg:block">
                                                    {/* Spacer */}
                                                </div>
                                                <div className="col-span-1 sm:col-span-2 lg:col-span-3 space-y-2">
                                                    <FieldLabel>Honors / Achievements</FieldLabel>
                                                    {isEditing ? (
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
                                    ))}
                                    {(field.state.value || []).length === 0 && (
                                        <div className="text-center py-12 bg-white/10 rounded-xl border border-dashed border-white/30">
                                            <Typography className="text-gray-500">No qualifications added yet.</Typography>
                                        </div>
                                    )}
                                </div>
                            )}
                        </form.Field>
                    </BluryCard>
                )}

                {role === "STUDENT" && (
                    <BluryCard isCentered={false} childClass="space-y-8" className="rounded-2xl">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/20 pb-4">
                            <div className="flex items-center gap-3">
                                <Briefcase className="size-5 text-gray-700" />
                                <Typography font="title">Work Experience</Typography>
                            </div>
                            {isEditing && (
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
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <form.Field name="academicGap">
                                {(field) => (
                                    <F field={field} label="Academic Gap (Years)">
                                        {isEditing ? (
                                            <Input
                                                type="number"
                                                value={field.state.value}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                placeholder="0"
                                            />
                                        ) : (
                                            <div className="p-3 bg-white/10 rounded-lg font-medium">{field.state.value || "0"}</div>
                                        )}
                                    </F>
                                )}
                            </form.Field>
                        </div>

                        <form.Field name="experiences">
                            {(field) => (
                                <div className="space-y-6">
                                    {(field.state.value || []).map((item: any, index: number) => (
                                        <div key={index} className="relative p-6 bg-white/20 rounded-xl border border-white/30 space-y-4">
                                            {isEditing && (
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
                                                    {isEditing ? (
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
                                                    {isEditing ? (
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
                                                    {isEditing ? (
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
                                                    {isEditing ? (
                                                        <Input
                                                            value={item.country}
                                                            onChange={(e) => {
                                                                const current = [...field.state.value]
                                                                current[index].country = e.target.value
                                                                field.handleChange(current)
                                                            }}
                                                            placeholder="USA"
                                                        />
                                                    ) : (
                                                        <Typography className="p-3 bg-white/10 rounded-lg font-medium">{item.country || "N/A"}</Typography>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <FieldLabel>Start Date</FieldLabel>
                                                    {isEditing ? (
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
                                                    {isEditing ? (
                                                        <DatePicker
                                                            value={item.endDate}
                                                            onChange={(v) => {
                                                                const current = [...field.state.value]
                                                                if (current[index].startDate && v < current[index].startDate) {
                                                                    // Validation: End Date cannot be before Start Date
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
                                                    {isEditing ? (
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
                    </BluryCard>
                )}

                {role === "AGENT" && (
                    <BluryCard isCentered={false} childClass="space-y-8" className="rounded-2xl">
                        <div className="flex items-center gap-3 border-b border-white/20 pb-4">
                            <Briefcase className="size-5 text-gray-700" />
                            <Typography font="title">Agent Information</Typography>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <form.Field name="contact_person_name">
                                {(field) => (
                                    <F field={field} label="Contact Person Name">
                                        {isEditing ? (
                                            <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="Enter Contact Person Name" />
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
                                                    const val = Math.max(0, Number(e.target.value))
                                                    field.handleChange(val)
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
                                            <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="Enter your Country" />
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
                                            <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="Enter your City" />
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
                                            <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="Enter your Country" />
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
                                            <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="Enter your City" />
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
 
                <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4 pb-12">
                    {isEditing && (
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto sm:px-8 py-6 rounded-xl border font-bold border-brand-byzantine text-brand-byzantine hover:bg-brand-byzantine/5 hover:text-brand-byzantine"
                            onClick={() => {
                                form.reset()
                                setIsEditing(false)
                            }}
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
