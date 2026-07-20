"use client"

import { useForm } from "@tanstack/react-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Typography } from "@/components/shared/Typography"
import { DatePicker } from "@/components/shared/date-picker"
import {
    createEmptyExperienceItem,
    onboardingExperienceStepSchema,
    type ExperienceFormItem,
} from "@/types/schemas/auth"
import type { z } from "zod"
import { COUNTRIES, F, INDUSTRIES } from "./_shared"
import { useAuth } from "@/hooks/useAuth"
import { PageLoader } from "@/components/shared/page-loader"

type Defaults = z.input<typeof onboardingExperienceStepSchema>

function getFieldState(field: {
    state: { meta: { isTouched: boolean; isValid: boolean; errors?: unknown[] } }
    form: { state: { isSubmitted: boolean } }
}) {
    const isInvalid = (field.state.meta.isTouched || field.form.state.isSubmitted) && !field.state.meta.isValid
    const raw = field.state.meta.errors?.[0]
    const error = raw == null
        ? undefined
        : typeof raw === "string"
            ? raw
            : (raw as { message?: string }).message
    return { isInvalid, error }
}

function mapExperienceToFormItem(entry: {
    jobTitle?: string
    organization?: string
    industry?: string
    country?: string
    startDate?: string
    endDate?: string
    responsibilities?: string
}): ExperienceFormItem {
    return {
        name: entry.jobTitle ?? "",
        organization: entry.organization ?? "",
        industry: entry.industry ?? "",
        country: entry.country ?? "",
        startDate: entry.startDate ?? "",
        endDate: entry.endDate ?? "",
        responsibility: entry.responsibilities ?? "",
    }
}

function Step3Form({ defaultValues, onBack, onNext }: { defaultValues: Defaults; onBack: () => void; onNext: () => void }) {
    const { me, experience: saveExperience } = useAuth()
    const { data: meData, refetch: refetchMe } = me

    const form = useForm({
        defaultValues,
        validators: { onSubmit: onboardingExperienceStepSchema },
        onSubmit: async ({ value }) => {
            if (!meData?.id) return

            if (!form.state.isDirty) {
                onNext()
                return
            }

            await saveExperience.mutateAsync({
                userId: meData.id,
                hasExperience: "yes",
                experiences: value.experiences.map((exp) => ({
                    name: exp.name,
                    organization: exp.organization,
                    industry: exp.industry,
                    country: exp.country,
                    startDate: exp.startDate,
                    endDate: exp.endDate,
                    responsibility: exp.responsibility,
                })),
            })
            await refetchMe()
            onNext()
        },
    })

    return (
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit() }}>
            <form.Field name="experiences" mode="array">
                {(field) => (
                    <div className="space-y-6">
                        {field.state.value.map((_, i) => (
                            <div key={i} className="space-y-4">
                                <div className="flex flex-col md:flex-row flex-wrap gap-4">
                                    <form.Field name={`experiences[${i}].name`}>
                                        {(subField) => {
                                            const { isInvalid, error } = getFieldState(subField)
                                            return (
                                                <div className="flex-1 min-w-[200px]">
                                                    <F isInvalid={isInvalid} error={error} label="Job Title">
                                                        <Input
                                                            value={subField.state.value}
                                                            onBlur={subField.handleBlur}
                                                            onChange={(e) => subField.handleChange(e.target.value)}
                                                            placeholder="e.g. Software Engineer"
                                                            className="w-full"
                                                        />
                                                    </F>
                                                </div>
                                            )
                                        }}
                                    </form.Field>

                                    <form.Field name={`experiences[${i}].organization`}>
                                        {(subField) => {
                                            const { isInvalid, error } = getFieldState(subField)
                                            return (
                                                <div className="flex-1 min-w-[200px]">
                                                    <F isInvalid={isInvalid} error={error} label="Organization">
                                                        <Input
                                                            value={subField.state.value}
                                                            onBlur={subField.handleBlur}
                                                            onChange={(e) => subField.handleChange(e.target.value)}
                                                            placeholder="e.g. Acme Corp"
                                                            className="w-full"
                                                        />
                                                    </F>
                                                </div>
                                            )
                                        }}
                                    </form.Field>

                                    <form.Field name={`experiences[${i}].industry`}>
                                        {(subField) => {
                                            const { isInvalid, error } = getFieldState(subField)
                                            return (
                                                <div className="flex-1 min-w-[200px]">
                                                    <F isInvalid={isInvalid} error={error} label="Industry">
                                                        <Select
                                                            value={subField.state.value}
                                                            onValueChange={subField.handleChange}
                                                        >
                                                            <SelectTrigger className="h-12 w-full">
                                                                <SelectValue placeholder="Select industry" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {INDUSTRIES.map((industry) => (
                                                                    <SelectItem key={industry} value={industry}>
                                                                        {industry}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </F>
                                                </div>
                                            )
                                        }}
                                    </form.Field>

                                    <form.Field name={`experiences[${i}].country`}>
                                        {(subField) => {
                                            const { isInvalid, error } = getFieldState(subField)
                                            return (
                                                <div className="flex-1 min-w-[200px]">
                                                    <F isInvalid={isInvalid} error={error} label="Country">
                                                        <Select
                                                            value={subField.state.value}
                                                            onValueChange={subField.handleChange}
                                                        >
                                                            <SelectTrigger className="h-12 w-full">
                                                                <SelectValue placeholder="Select country" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {COUNTRIES.map((country) => (
                                                                    <SelectItem key={country} value={country}>
                                                                        {country}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </F>
                                                </div>
                                            )
                                        }}
                                    </form.Field>

                                    <form.Field name={`experiences[${i}].startDate`}>
                                        {(subField) => {
                                            const { isInvalid, error } = getFieldState(subField)
                                            return (
                                                <div className="flex-1 min-w-[200px]">
                                                    <F isInvalid={isInvalid} error={error} label="Start Date">
                                                        <DatePicker
                                                            value={subField.state.value}
                                                            onChange={subField.handleChange}
                                                            placeholder="Select start date"
                                                        />
                                                    </F>
                                                </div>
                                            )
                                        }}
                                    </form.Field>

                                    <form.Field name={`experiences[${i}].endDate`}>
                                        {(subField) => {
                                            const { isInvalid, error } = getFieldState(subField)
                                            return (
                                                <div className="flex-1 min-w-[200px]">
                                                    <F isInvalid={isInvalid} error={error} label="End Date">
                                                        <DatePicker
                                                            value={subField.state.value}
                                                            onChange={(val) => {
                                                                const startDate = form.getFieldValue(`experiences[${i}].startDate`)
                                                                if (startDate && val < startDate) return
                                                                subField.handleChange(val)
                                                            }}
                                                            placeholder="Select end date"
                                                        />
                                                    </F>
                                                </div>
                                            )
                                        }}
                                    </form.Field>
                                </div>

                                <form.Field name={`experiences[${i}].responsibility`}>
                                    {(subField) => {
                                        const { isInvalid, error } = getFieldState(subField)
                                        return (
                                            <F isInvalid={isInvalid} error={error} label="Key Responsibilities">
                                                <textarea
                                                    value={subField.state.value}
                                                    onBlur={subField.handleBlur}
                                                    onChange={(e) => subField.handleChange(e.target.value)}
                                                    placeholder="Describe your key responsibilities..."
                                                    className="w-full min-h-[100px] rounded-sm border border-input bg-brand-input px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                />
                                            </F>
                                        )
                                    }}
                                </form.Field>
                            </div>
                        ))}

                        {/* <Button
                            type="button"
                            variant="outline"
                            className="w-full gap-2 border border-brand-byzantine text-brand-byzantine hover:bg-brand-byzantine/5"
                            onClick={() => {
                                field.handleChange([...field.state.value, createEmptyExperienceItem()])
                            }}
                        >
                            <Plus size={16} /> Add more
                        </Button> */}
                    </div>
                )}
            </form.Field>

            {saveExperience.isError && (
                <Typography as="p" font="text" className="text-destructive text-sm mt-4 text-center sm:text-left">
                    {saveExperience.error?.message}
                </Typography>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <Button type="button" variant="outline" className="w-full sm:w-auto sm:flex-1" onClick={onBack}>
                    Back
                </Button>
                <Button type="submit" className="w-full sm:w-auto sm:flex-1 capitalize" disabled={saveExperience.isPending}>
                    {saveExperience.isPending ? "Saving..." : "Continue"}
                </Button>
            </div>
        </form>
    )
}

export function Step3Experience({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
    const { me } = useAuth()
    const { data: meData, isLoading } = me

    if (isLoading) return <PageLoader />

    const experiences: ExperienceFormItem[] = meData?.experience?.entries?.length
        ? meData.experience.entries.map(mapExperienceToFormItem)
        : [createEmptyExperienceItem()]

    return (
        <Step3Form
            key={JSON.stringify(experiences)}
            defaultValues={{ experiences }}
            onBack={onBack}
            onNext={onNext}
        />
    )
}
