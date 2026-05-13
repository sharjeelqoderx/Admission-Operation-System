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
    Edit2
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
        },
        onSubmit: async ({ value }) => {
            const fd = new FormData()
            Object.entries(value).forEach(([key, val]) => {
                if (key === "avatar" && val instanceof File) {
                    fd.append("avatar", val)
                } else if (val !== null && val !== undefined && val !== "") {
                    fd.append(key, String(val))
                }
            })
            await mutation.mutateAsync(fd)
            setIsEditing(false)
        },
    })

    if (isLoading) return <PageLoader label="Loading your profile..." />
    if (isError) return <ErrorView message="Failed to load profile. Please try again." />

    const role = user?.role

    return (
        <main className="mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <Typography font="heading" as="h1">My Profile</Typography>
                    <Typography font="text" className="text-gray-500">
                        Manage your personal information and preferences.
                    </Typography>
                </div>
                {!isEditing && (
                    <Button
                        onClick={() => setIsEditing(true)}
                        className="bg-brand-byzantine hover:bg-brand-byzantine/90 text-white"
                    >
                        <Edit2 size={24} />{" "}
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

                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="shrink-0 flex flex-col items-center gap-4">
                            <form.Field name="avatar">
                                {(field) => (
                                    <div className="space-y-2">
                                        <ImageUploadCard
                                            value={field.state.value ?? (user?.avatarUrl || null)}
                                            onChange={(file) => field.handleChange(file as File)}
                                            message="Upload Photo"
                                            disabled={!isEditing}
                                            className={cn(
                                                "size-40 overflow-hidden border-4 border-white/40 shadow-lg",
                                                !isEditing && "opacity-80 pointer-events-none"
                                            )}
                                        />
                                    </div>
                                )}
                            </form.Field>
                        </div>

                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <form.Field name="fullName">
                                {(field) => (
                                    <F field={field} label="Full Name">
                                        {isEditing ? (
                                            <Input
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                placeholder="Enter your full name"
                                            />
                                        ) : (
                                            <div className="p-3 bg-white/10 rounded-lg border border-white/5 min-h-12 flex items-center">
                                                <Typography className="text-gray-800 font-medium">{field.state.value || "N/A"}</Typography>
                                            </div>
                                        )}
                                    </F>
                                )}
                            </form.Field>

                            <div className="space-y-2">
                                <FieldLabel>Email Address</FieldLabel>
                                <div className="p-3 bg-gray-100/30 rounded-lg border border-white/5 min-h-12 flex items-center cursor-not-allowed">
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
                                            />
                                        ) : (
                                            <div className="p-3 bg-white/10 rounded-lg border border-white/5 min-h-12 flex items-center">
                                                <Typography className="text-gray-800 font-medium">{field.state.value || "N/A"}</Typography>
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
                                            <div className="p-3 bg-white/10 rounded-lg border border-white/5 min-h-12 flex items-center">
                                                <Typography className="text-gray-800 font-medium">{field.state.value || "N/A"}</Typography>
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
                                                <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="MALE">Male</SelectItem>
                                                    <SelectItem value="FEMALE">Female</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="p-3 bg-white/10 rounded-lg border border-white/5 min-h-12 flex items-center">
                                                <Typography className="text-gray-800 font-medium uppercase">{field.state.value || "N/A"}</Typography>
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

                <div className="flex justify-end gap-4 pt-4">
                    {isEditing && (
                        <Button
                            type="button"
                            variant="outline"
                            className="px-8 py-6 rounded-xl border font-bold border-brand-byzantine text-brand-byzantine hover:bg-brand-byzantine/5 hover:text-brand-byzantine"
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
                                    className="px-12 py-6 bg-brand-byzantine hover:bg-brand-byzantine/80"
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
