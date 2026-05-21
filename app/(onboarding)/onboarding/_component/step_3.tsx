"use client"

import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Typography } from "@/components/shared/Typography"
import { F, DatePicker } from "./_shared"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import { PageLoader } from "@/components/shared/page-loader"

const schema = z.object({
    hasExperience: z.enum(["yes", "no"], { message: "Please select an option" }),
    experiences: z.array(z.object({
        jobTitle: z.string(),
        organization: z.string(),
        industry: z.string(),
        country: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        responsibilities: z.string(),
    })).optional()
}).superRefine((data, ctx) => {
    if (data.hasExperience === "yes" && data.experiences) {
        data.experiences.forEach((exp, i) => {
            if (!exp.jobTitle?.trim()) ctx.addIssue({ path: ["experiences", i, "jobTitle"], code: "custom", message: "Job title is required" })
            if (!exp.organization?.trim()) ctx.addIssue({ path: ["experiences", i, "organization"], code: "custom", message: "Organization is required" })
            if (!exp.industry?.trim()) ctx.addIssue({ path: ["experiences", i, "industry"], code: "custom", message: "Industry is required" })
            if (!exp.country?.trim()) ctx.addIssue({ path: ["experiences", i, "country"], code: "custom", message: "Country is required" })
            if (!exp.startDate?.trim()) ctx.addIssue({ path: ["experiences", i, "startDate"], code: "custom", message: "Start date is required" })
            if (!exp.endDate?.trim()) ctx.addIssue({ path: ["experiences", i, "endDate"], code: "custom", message: "End date is required" })
            if (!exp.responsibilities?.trim()) ctx.addIssue({ path: ["experiences", i, "responsibilities"], code: "custom", message: "Responsibilities are required" })
        })
    }
})

type Defaults = {
    hasExperience: "yes" | "no"
    experiences?: Array<{
        jobTitle: string
        organization: string
        industry: string
        country: string
        startDate: string
        endDate: string
        responsibilities: string
    }>
}

function Step3Form({ defaultValues, onBack }: { defaultValues: Defaults; onBack: () => void }) {
    const router = useRouter()
    const { me, experience: saveExperience } = useAuth()
    const { data: meData } = me

    const form = useForm({
        defaultValues,
        validators: { onSubmit: schema },
        onSubmit: async ({ value }) => {
            if (!meData?.id) return
            await saveExperience.mutateAsync({
                userId: meData.id,
                hasExperience: value.hasExperience,
                experiences: value.hasExperience === "yes" ? (value.experiences?.map(exp => ({
                    name: exp.jobTitle,
                    organization: exp.organization,
                    industry: exp.industry,
                    country: exp.country,
                    startDate: exp.startDate,
                    endDate: exp.endDate,
                    responsibility: exp.responsibilities
                })) || []) : []
            })
            router.push("/dashboard")
        },
    })

    return (
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit() }}>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

                {/* Experience Yes/No */}
                <form.Field name="hasExperience">
                    {(field) => (
                        <div className="sm:col-span-2 min-w-[200px]">
                            <F
                                isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                                error={field.state.meta.errors?.[0]}
                                label="Do you have professional work experience?"
                            >
                                <div className="flex flex-wrap gap-2 min-w-[200px]">
                                    {(["yes", "no"] as const).map((opt) => {
                                        const isActive = field.state.value === opt
                                        return (
                                            <button
                                                type="button"
                                                key={opt}
                                                onClick={() => field.handleChange(opt)}
                                                className={cn(
                                                    "px-6 py-1.5 rounded-md text-sm font-medium capitalize transition-all",
                                                    isActive
                                                        ? "bg-brand-byzantine text-white shadow-sm"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                                )}
                                            >
                                                {opt}
                                            </button>
                                        )
                                    })}
                                </div>
                            </F>
                        </div>
                    )}
                </form.Field>

                {/* Conditional Fields */}
                <form.Subscribe selector={s => s.values.hasExperience}>
                    {(hasExp) => hasExp === "yes" ? (
                        <div className="sm:col-span-2">
                            <form.Field name="experiences" mode="array">
                                {(field) => (
                                    <div className="space-y-8">
                                        {(field.state.value || []).map((_, i) => (
                                            <div key={i} className="space-y-4 pb-4 border-b border-border/50 relative">
                                                {i > 0 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => field.removeValue(i)}
                                                        className="absolute right-0 top-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    >
                                                        Remove
                                                    </Button>
                                                )}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-2">
                                                    <form.Field name={`experiences[${i}].jobTitle`}>
                                                        {(subField) => (
                                                            <div className="min-w-[200px]">
                                                                <F isInvalid={subField.state.meta.isTouched && !subField.state.meta.isValid} error={subField.state.meta.errors?.[0]} label="Job Title / Designation">
                                                                    <Input value={subField.state.value || ""} onChange={e => subField.handleChange(e.target.value)} className="w-full min-w-[200px]" placeholder="Enter designation" />
                                                                </F>
                                                            </div>
                                                        )}
                                                    </form.Field>

                                                    <form.Field name={`experiences[${i}].organization`}>
                                                        {(subField) => (
                                                            <div className="min-w-[200px]">
                                                                <F isInvalid={subField.state.meta.isTouched && !subField.state.meta.isValid} error={subField.state.meta.errors?.[0]} label="Organization / Company Name">
                                                                    <Input value={subField.state.value || ""} onChange={e => subField.handleChange(e.target.value)} className="w-full min-w-[200px]" placeholder="Enter company name" />
                                                                </F>
                                                            </div>
                                                        )}
                                                    </form.Field>

                                                    <form.Field name={`experiences[${i}].industry`}>
                                                        {(subField) => (
                                                            <div className="min-w-[200px]">
                                                                <F isInvalid={subField.state.meta.isTouched && !subField.state.meta.isValid} error={subField.state.meta.errors?.[0]} label="Industry / Sector">
                                                                    <Input value={subField.state.value || ""} onChange={(e) => subField.handleChange(e.target.value)} className="w-full min-w-[200px]" placeholder="Enter sector" />
                                                                </F>
                                                            </div>
                                                        )}
                                                    </form.Field>

                                                    <form.Field name={`experiences[${i}].country`}>
                                                        {(subField) => (
                                                            <div className="min-w-[200px]">
                                                                <F isInvalid={subField.state.meta.isTouched && !subField.state.meta.isValid} error={subField.state.meta.errors?.[0]} label="Country / Location">
                                                                    <Input value={subField.state.value || ""} onChange={(e) => subField.handleChange(e.target.value)} className="w-full min-w-[200px]" placeholder="Enter country name" />
                                                                </F>
                                                            </div>
                                                        )}
                                                    </form.Field>

                                                    <form.Field name={`experiences[${i}].startDate`}>
                                                        {(subField) => (
                                                            <div className="min-w-[200px]">
                                                                <F isInvalid={subField.state.meta.isTouched && !subField.state.meta.isValid} error={subField.state.meta.errors?.[0]} label="Start Date">
                                                                    <DatePicker value={subField.state.value || ""} onChange={subField.handleChange} />
                                                                </F>
                                                            </div>
                                                        )}
                                                    </form.Field>

                                                    <form.Field name={`experiences[${i}].endDate`}>
                                                        {(subField) => (
                                                            <div className="min-w-[200px]">
                                                                <F isInvalid={subField.state.meta.isTouched && !subField.state.meta.isValid} error={subField.state.meta.errors?.[0]} label="End Date">
                                                                    <DatePicker value={subField.state.value || ""} onChange={subField.handleChange} />
                                                                </F>
                                                            </div>
                                                        )}
                                                    </form.Field>

                                                    <form.Field name={`experiences[${i}].responsibilities`}>
                                                        {(subField) => (
                                                            <div className="sm:col-span-2">
                                                                <F isInvalid={subField.state.meta.isTouched && !subField.state.meta.isValid} error={subField.state.meta.errors?.[0]} label="Key Responsibilities">
                                                                    <textarea id={subField.name} value={subField.state.value || ""} onBlur={subField.handleBlur} onChange={e => subField.handleChange(e.target.value)} placeholder="Describe your key responsibilities..." rows={4} className="w-full rounded-sm border border-input bg-brand-input px-2.5 py-3 text-sm outline-none resize-none placeholder:text-muted-foreground" />
                                                                </F>
                                                            </div>
                                                        )}
                                                    </form.Field>
                                                </div>
                                            </div>
                                        ))}

                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => field.pushValue({ jobTitle: "", organization: "", industry: "", country: "", startDate: "", endDate: "", responsibilities: "" })}
                                        >
                                            + Add another experience
                                        </Button>
                                    </div>
                                )}
                            </form.Field>
                        </div>
                    ) : null}
                </form.Subscribe>

            </div>

            {saveExperience.isError && (
                <Typography className="text-destructive mt-4 text-sm">
                    {saveExperience.error?.message}
                </Typography>
            )}

            <div className="flex flex-wrap gap-3 mt-8">
                <Button type="button" variant="outline" className="flex-1 min-w-[200px]" onClick={onBack}>
                    Back
                </Button>

                <Button
                    type="submit"
                    className="flex-1 min-w-[200px]"
                    disabled={saveExperience.isPending}
                >
                    {saveExperience.isPending ? "Saving..." : "Submit"}
                </Button>
            </div>

        </form>
    )
}

export function Step3Work({ onBack }: { onBack: () => void }) {
    const { me } = useAuth()
    const { data: meData, isLoading } = me

    if (isLoading) return <PageLoader label="Finalizing setup..." />

    const experiences = meData?.experience?.entries?.length ? meData.experience.entries.map(e => ({
        jobTitle: e.jobTitle ?? "",
        organization: e.organization ?? "",
        industry: e.industry ?? "",
        country: e.country ?? "",
        startDate: e.startDate ?? "",
        endDate: e.endDate ?? "",
        responsibilities: e.responsibilities ?? "",
    })) : [{
        jobTitle: "",
        organization: "",
        industry: "",
        country: "",
        startDate: "",
        endDate: "",
        responsibilities: "",
    }]

    const defaults: Defaults = {
        hasExperience: meData?.experience?.hasExperience ?? "no",
        experiences,
    }

    return <Step3Form key={JSON.stringify(defaults)} defaultValues={defaults} onBack={onBack} />
}