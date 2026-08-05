"use client"

import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useQueryClient } from "@tanstack/react-query"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PhoneInputComponent } from "@/components/ui/phone-input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Typography } from "@/components/shared/Typography"
import { F, DatePicker } from "./_shared"
import { useAuth } from "@/hooks/useAuth"
import { profileStep1Schema } from "@/types/schemas/auth"
import { ImageUploadCard } from "@/components/shared/image-upload-card"
import { PageLoader } from "@/components/shared/page-loader"
import { CountrySelect } from "@/components/shared/country-select"
import { StateSelect } from "@/components/shared/state-select"
import { CitySelect } from "@/components/shared/city-select"
import { AddressFormFieldGroup } from "@/components/shared/address-form-field-group"

function genderFromTitle(title: string): "male" | "female" | undefined {
    switch (title) {
        case "Mr":
            return "male"
        case "Mrs":
        case "Ms":
            return "female"
        default:
            return undefined
    }
}

const step1FormSchema = profileStep1Schema.extend({
    title: z.enum(["Mr", "Mrs", "Ms"], { message: "Select title" }),
}).superRefine((data, ctx) => {
    const mappedGender = genderFromTitle(data.title)
    if (!mappedGender || data.gender !== mappedGender) {
        ctx.addIssue({
            path: ["gender"],
            code: "custom",
            message: "Select a title to set gender",
        })
    }
})

function Step1Form({
    defaultValues,
    onNext,
}: {
    defaultValues: {
        title: string
        dob: string
        gender: string
        country: string
        state: string
        city: string
        nationality: string
        street_1: string
        street_2: string
        street_3: string
        post_code: string
        guardianEmail: string
        guardianPhone: string
        avatar_url: File | string | null
    }
    onNext: () => void
}) {
    const { me, profile: updateProfile } = useAuth()
    const { data: meData } = me
    const queryClient = useQueryClient()
    const [submitError, setSubmitError] = useState<string | null>(null)

    const form = useForm({
        defaultValues,
        validators: { onSubmit: step1FormSchema },

        onSubmit: async ({ value }) => {
            if (!meData?.id) return

            if (!form.state.isDirty) {
                onNext()
                return
            }

            try {
                setSubmitError(null)
                const fd = new FormData()
                if (value.title) fd.append("title", value.title)
                fd.append("dob", value.dob)
                const gender = genderFromTitle(value.title) ?? value.gender
                fd.append("gender", gender)
                fd.append("country", value.country)
                fd.append("state", value.state)
                fd.append("city", value.city)
                fd.append("nationality", value.nationality)
                fd.append("street_1", value.street_1)
                fd.append("street_2", value.street_2)
                fd.append("street_3", value.street_3)
                fd.append("post_code", value.post_code)
                fd.append("guardianEmail", value.guardianEmail)
                fd.append("guardianPhone", value.guardianPhone)
                if (value.avatar_url) fd.append("avatar_url", value.avatar_url)

                await updateProfile.mutateAsync(fd)
                await queryClient.invalidateQueries({ queryKey: ["me"] })
                onNext()
            } catch (err) {
                setSubmitError(err instanceof Error ? err.message : "Something went wrong")
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 min-w-0">

                <form.Field name="avatar_url">
                    {(field) => (
                        <div className="sm:col-span-2 w-full max-w-sm">
                            <ImageUploadCard
                                value={field.state.value}
                                onChange={field.handleChange}
                                message="Upload profile picture"
                                className="w-full min-h-[180px] max-h-[220px]"
                            />
                        </div>
                    )}
                </form.Field>

                <form.Field name="title">
                    {(field) => (
                        <F
                            label="Title"
                            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                            error={field.state.meta.errors?.[0]}
                        >
                            <Select
                                value={field.state.value || undefined}
                                onValueChange={(v) => {
                                    field.handleChange(v)
                                    const mappedGender = genderFromTitle(v)
                                    if (mappedGender) {
                                        form.setFieldValue("gender", mappedGender)
                                    }
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select title" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Mr">Mr</SelectItem>
                                    <SelectItem value="Mrs">Mrs</SelectItem>
                                    <SelectItem value="Ms">Ms</SelectItem>
                                </SelectContent>
                            </Select>
                        </F>
                    )}
                </form.Field>

                <form.Field name="gender">
                    {(field) => (
                        <form.Subscribe selector={(s) => s.values.title}>
                            {(title) => {
                                const derivedGender =
                                    genderFromTitle(title) ?? field.state.value
                                return (
                                    <F
                                        label="Gender"
                                        isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                                        error={field.state.meta.errors?.[0]}
                                    >
                                        <Select
                                            value={derivedGender || undefined}
                                            disabled
                                        >
                                            <SelectTrigger className="w-full capitalize opacity-100">
                                                <SelectValue placeholder="Select title first" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="male">Male</SelectItem>
                                                <SelectItem value="female">Female</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </F>
                                )
                            }}
                        </form.Subscribe>
                    )}
                </form.Field>

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

                <form.Field name="street_1">
                    {(field) => (
                        <F
                            label="Street 1"
                            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                            error={field.state.meta.errors?.[0]}
                        >
                            <Input
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="Enter street line 1"
                                className="w-full"
                            />
                        </F>
                    )}
                </form.Field>

                <form.Field name="street_2">
                    {(field) => (
                        <F
                            label="Street 2"
                            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                            error={field.state.meta.errors?.[0]}
                        >
                            <Input
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="Enter street line 2 (optional)"
                                className="w-full"
                            />
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
                                onValueChange={(v) => {
                                    const previousCountry = field.state.value
                                    const currentNationality = form.getFieldValue("nationality")
                                    field.handleChange(v)
                                    form.setFieldValue("state", "")
                                    form.setFieldValue("city", "")
                                    if (
                                        !currentNationality ||
                                        currentNationality === previousCountry
                                    ) {
                                        form.setFieldValue("nationality", v)
                                    }
                                }}
                            />
                        </F>
                    )}
                </form.Field>

                <form.Subscribe selector={(s) => s.values.country}>
                    {(country) => (
                        <form.Field name="state">
                            {(field) => (
                                <F
                                    label="State"
                                    isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                                    error={field.state.meta.errors?.[0]}
                                >
                                    <StateSelect
                                        country={country}
                                        value={field.state.value}
                                        onValueChange={(v) => {
                                            field.handleChange(v)
                                            form.setFieldValue("city", "")
                                        }}
                                    />
                                </F>
                            )}
                        </form.Field>
                    )}
                </form.Subscribe>

                <form.Subscribe selector={(s) => ({ country: s.values.country, state: s.values.state })}>
                    {({ country, state }) => (
                        <form.Field name="city">
                            {(field) => (
                                <F
                                    label="City"
                                    isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                                    error={field.state.meta.errors?.[0]}
                                >
                                    <CitySelect
                                        country={country}
                                        state={state}
                                        value={field.state.value}
                                        onValueChange={field.handleChange}
                                    />
                                </F>
                            )}
                        </form.Field>
                    )}
                </form.Subscribe>

                <form.Field name="nationality">
                    {(field) => (
                        <F
                            label="Nationality"
                            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                            error={field.state.meta.errors?.[0]}
                        >
                            <CountrySelect
                                id={field.name}
                                value={field.state.value}
                                onValueChange={field.handleChange}
                                placeholder="Select nationality"
                            />
                        </F>
                    )}
                </form.Field>

                <AddressFormFieldGroup
                    form={form}
                    isEditing
                    renderField={({ field, label, children }) => (
                        <F
                            label={label}
                            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                            error={field.state.meta.errors?.[0]}
                        >
                            {children}
                        </F>
                    )}
                />

                <form.Field name="guardianPhone">
                    {(field) => (
                        <F
                            label="Parent/Guardian Phone"
                            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                            error={field.state.meta.errors?.[0]}
                        >
                            <PhoneInputComponent
                                className="w-full"
                                value={field.state.value}
                                onChange={(value) => field.handleChange(value)}
                                placeholder="Enter phone number"
                            />
                        </F>
                    )}
                </form.Field>

                <form.Field name="guardianEmail">
                    {(field) => (
                        <F
                            label="Parent/Guardian Email"
                            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                            error={field.state.meta.errors?.[0]}
                        >
                            <Input
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="Enter guardian email"
                                className="w-full"
                            />
                        </F>
                    )}
                </form.Field>

            </div>

            {(updateProfile.isError || submitError) && (
                <Typography className="text-destructive mt-4 text-sm">
                    {submitError ?? updateProfile.error?.message}
                </Typography>
            )}

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

export function Step1Basic({ onNext }: { onNext: () => void }) {
    const { me } = useAuth()
    const { data: meData, isLoading } = me

    if (isLoading) {
        return <PageLoader />
    }

    const profileTitle = meData?.title ?? ""
    const title =
        profileTitle === "Mr" || profileTitle === "Mrs" || profileTitle === "Ms"
            ? profileTitle
            : ""

    const defaults = {
        title,
        dob: meData?.profile?.dateOfBirth ?? "",
        gender:
            genderFromTitle(title) ??
            (meData?.profile?.gender?.toLowerCase() as string) ??
            "",
        country: meData?.profile?.country ?? "",
        state: meData?.profile?.state ?? "",
        city: meData?.profile?.city ?? "",
        nationality: meData?.profile?.nationality ?? meData?.profile?.country ?? "",
        street_1: meData?.profile?.street_1 ?? meData?.profile?.address ?? "",
        street_2: meData?.profile?.street_2 ?? "",
        street_3: meData?.profile?.street_3 ?? "",
        post_code: meData?.profile?.post_code ?? meData?.profile?.zip_code ?? "",
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
