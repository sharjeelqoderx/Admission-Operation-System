"use client"

import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Typography } from "@/components/shared/Typography"
import { F, DatePicker, GENDERS } from "./_shared"
import { useAuth } from "@/hooks/useAuth"
import { profileStep1Schema } from "@/types/schemas/auth"
import { ImageUploadCard } from "@/components/shared/image-upload-card"
import { PageLoader } from "@/components/shared/page-loader"
import { CountrySelect } from "@/components/shared/country-select"

/* ---------------- FORM ---------------- */

function Step1Form({
    defaultValues,
    onNext,
}: {
    defaultValues: any
    onNext: () => void
}) {
    const { me, profile: updateProfile } = useAuth()
    const { data: meData } = me

    const form = useForm({
        defaultValues: {
            dob: defaultValues.dob,
            gender: defaultValues.gender,
            country: defaultValues.country,
            state: defaultValues.state,
            city: defaultValues.city,
            nationality: defaultValues.nationality,
            guardianEmail: defaultValues.guardianEmail,
            guardianPhone: defaultValues.guardianPhone,
            avatar_url: defaultValues.avatar_url as File | string | null,
        },
        validators: { onSubmit: profileStep1Schema },

        onSubmit: async ({ value }) => {
            if (!meData?.id) return

            try {
                const fd = new FormData()
                fd.append("dob", value.dob)
                fd.append("gender", value.gender)
                fd.append("country", value.country)
                fd.append("state", value.state)
                fd.append("city", value.city)
                fd.append("nationality", value.nationality)
                fd.append("guardianEmail", value.guardianEmail)
                fd.append("guardianPhone", value.guardianPhone)
                if (value.avatar_url) fd.append("avatar_url", value.avatar_url)

                await updateProfile.mutateAsync(fd)

                onNext()
            } catch (err) {
                console.error(err)
            }
        },
    })

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault()
                form.handleSubmit()
            }}
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                {/* ✅ IMAGE COMPONENT */}
                <form.Field name="avatar_url">
                    {(field) => (
                        <div className="sm:col-span-2">
                            <ImageUploadCard
                                value={field.state.value}
                                onChange={field.handleChange}
                                message="Upload profile picture"
                            />
                        </div>
                    )}
                </form.Field>

                {/* DOB */}
                <form.Field name="dob">
                    {(field) => (
                        <F
                            label="Date of Birth"
                            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                            error={field.state.meta.errors?.[0]}
                        >
                            <DatePicker
                                value={field.state.value}
                                onChange={field.handleChange}
                            />
                        </F>
                    )}
                </form.Field>

                {/* Gender */}
                <form.Field name="gender">
                    {(field) => (
                        <F
                            label="Gender"
                            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                            error={field.state.meta.errors?.[0]}
                        >
                            <Select
                                value={field.state.value}
                                onValueChange={field.handleChange}
                            >
                                <SelectTrigger className="capitalize">
                                    <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                    {GENDERS.map((g) => (
                                        <SelectItem className="capitalize" key={g} value={g}>
                                            {g}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </F>
                    )}
                </form.Field>

                <form.Field name="country">
                    {(field) => (
                        <F
                            label="Country"
                            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                            error={field.state.meta.errors?.[0]}
                        >
                            <CountrySelect
                                value={field.state.value}
                                onValueChange={field.handleChange}
                            />
                        </F>
                    )}
                </form.Field>

                <form.Field name="state">
                    {(field) => (
                        <F
                            label="State"
                            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                            error={field.state.meta.errors?.[0]}
                        >
                            <Input
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="Enter your state"
                            />
                        </F>
                    )}
                </form.Field>

                <form.Field name="city">
                    {(field) => (
                        <F
                            label="City"
                            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                            error={field.state.meta.errors?.[0]}
                        >
                            <Input
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="Enter your city"
                            />
                        </F>
                    )}
                </form.Field>

                <form.Field name="nationality">
                    {(field) => (
                        <F
                            label="Nationality"
                            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                            error={field.state.meta.errors?.[0]}
                        >
                            <Input
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="Enter your nationality"
                            />
                        </F>
                    )}
                </form.Field>

                {/* Guardian Email */}
                <form.Field name="guardianEmail">
                    {(field) => (
                        <F
                            label="Guardian Email"
                            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                            error={field.state.meta.errors?.[0]}
                        >
                            <Input
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="Enter guardian email"
                            />
                        </F>
                    )}
                </form.Field>

                {/* Guardian Phone */}
                <form.Field name="guardianPhone">
                    {(field) => (
                        <F
                            label="Guardian Phone"
                            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                            error={field.state.meta.errors?.[0]}
                        >
                            <Input
                                type="number"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                onKeyDown={(e) => {
                                    if (["e", "E", "-", ".", "ArrowUp", "ArrowDown"].includes(e.key)) {
                                        e.preventDefault()
                                    }
                                }}
                                placeholder="Enter phone number"
                                className="w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                        </F>
                    )}
                </form.Field>

            </div>

            {/* ERROR */}
            {updateProfile.isError && (
                <Typography className="text-destructive mt-4 text-sm">
                    {updateProfile.error?.message}
                </Typography>
            )}

            {/* SUBMIT */}
            <div className="mt-8">
                <Button
                    type="submit"
                    className="w-full"
                    disabled={updateProfile.isPending}
                >
                    {updateProfile.isPending ? "Saving..." : "Continue"}
                </Button>
            </div>
        </form>
    )
}

/* ---------------- WRAPPER ---------------- */

export function Step1Basic({ onNext }: { onNext: () => void }) {
    const { me } = useAuth()
    const { data: meData, isLoading } = me

    if (isLoading) {
        return <PageLoader label="Preparing your profile..." />
    }

    const defaults = {
        dob: meData?.profile?.dateOfBirth ?? "",
        gender: (meData?.profile?.gender?.toLowerCase() as any) ?? "",
        country: meData?.profile?.country ?? "",
        state: meData?.profile?.state ?? "",
        city: meData?.profile?.city ?? "",
        nationality: meData?.profile?.nationality ?? "",
        guardianEmail: meData?.profile?.guardianEmail ?? "",
        guardianPhone: meData?.profile?.guardianPhone ?? "",
        avatar_url: meData?.avatarUrl ?? null,
    }

    return (
        <Step1Form
            key={JSON.stringify(defaults)}
            defaultValues={defaults}
            onNext={onNext}
        />
    )
}