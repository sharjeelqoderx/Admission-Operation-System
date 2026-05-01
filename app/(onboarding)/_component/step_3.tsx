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

const schema = z.object({
    academicGap: z.string().trim().regex(/^\d*$/, "Must be a number").refine(v => v === "" || (Number(v) >= 0 && Number(v) <= 50), "Must be between 0 and 50"),
    hasExperience: z.enum(["yes", "no"], { message: "Please select an option" }),
    jobTitle: z.string(),
    organization: z.string(),
    industry: z.string(),
    country: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    responsibilities: z.string(),
}).superRefine((data, ctx) => {
    if (data.hasExperience === "yes") {
        if (!data.jobTitle?.trim()) ctx.addIssue({ path: ["jobTitle"], code: "custom", message: "Job title is required" })
        if (!data.organization?.trim()) ctx.addIssue({ path: ["organization"], code: "custom", message: "Organization is required" })
        if (!data.industry?.trim()) ctx.addIssue({ path: ["industry"], code: "custom", message: "Industry is required" })
        if (!data.country?.trim()) ctx.addIssue({ path: ["country"], code: "custom", message: "Country is required" })
        if (!data.startDate?.trim()) ctx.addIssue({ path: ["startDate"], code: "custom", message: "Start date is required" })
        if (!data.endDate?.trim()) ctx.addIssue({ path: ["endDate"], code: "custom", message: "End date is required" })
        if (!data.responsibilities?.trim()) ctx.addIssue({ path: ["responsibilities"], code: "custom", message: "Responsibilities are required" })
    }
})

type Defaults = {
    academicGap: string
    hasExperience: "yes" | "no"
    jobTitle: string
    organization: string
    industry: string
    country: string
    startDate: string
    endDate: string
    responsibilities: string
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
                academicGap: Number(value.academicGap),
                hasExperience: value.hasExperience,
                name: value.jobTitle,
                organization: value.organization,
                industry: value.industry,
                country: value.country,
                startDate: value.startDate,
                endDate: value.endDate,
                responsibility: value.responsibilities
            })
            router.push("/dashboard")
        },
    })

    return (
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit() }}>

            {/* ✅ ONLY THIS LINE CHANGED */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

                {/* Academic Gap */}
                <form.Field name="academicGap">
                    {(field) => (
                        <div className="sm:col-span-2 min-w-[200px]">
                            <F
                                isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                                error={field.state.meta.errors?.[0]}
                                label="Academic Gap (in years)"
                            >
                                <Input
                                    id={field.name}
                                    type="number"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={e => field.handleChange(e.target.value)}
                                    placeholder="e.g. 1"
                                    className="w-full min-w-[200px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </F>
                        </div>
                    )}
                </form.Field>

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
                        <>

                            <form.Field name="jobTitle">
                                {(field) => (
                                    <div className="min-w-[200px]">
                                        <F
                                            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                                            error={field.state.meta.errors?.[0]}
                                            label="Job Title / Designation"
                                        >
                                            <Input
                                                value={field.state.value}
                                                onChange={e => field.handleChange(e.target.value)}
                                                className="w-full min-w-[200px]"
                                                placeholder="Enter designation"
                                            />
                                        </F>
                                    </div>
                                )}
                            </form.Field>

                            <form.Field name="organization">
                                {(field) => (
                                    <div className="min-w-[200px]">
                                        <F label="Organization / Company Name">
                                            <Input
                                                value={field.state.value}
                                                onChange={e => field.handleChange(e.target.value)}
                                                className="w-full min-w-[200px]"
                                                placeholder="Enter company name"
                                            />
                                        </F>
                                    </div>
                                )}
                            </form.Field>

                            <form.Field name="industry">
                                {(field) => (
                                    <div className="min-w-[200px]">
                                        <F label="Industry / Sector">
                                            <Input
                                                value={field.state.value}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                className="w-full min-w-[200px]"
                                                placeholder="Enter sector"
                                            />
                                        </F>
                                    </div>
                                )}
                            </form.Field>

                            <form.Field name="country">
                                {(field) => (
                                    <div className="min-w-[200px]">
                                        <F label="Country / Location">
                                            <Input
                                                value={field.state.value}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                className="w-full min-w-[200px]"
                                                placeholder="Enter country name"
                                            />
                                        </F>
                                    </div>
                                )}
                            </form.Field>

                            <form.Field name="startDate">
                                {(field) => (
                                    <div className="min-w-[200px]">
                                        <F label="Start Date">
                                            <DatePicker value={field.state.value} onChange={field.handleChange} />
                                        </F>
                                    </div>
                                )}
                            </form.Field>

                            <form.Field name="endDate">
                                {(field) => (
                                    <div className="min-w-[200px]">
                                        <F label="End Date">
                                            <DatePicker value={field.state.value} onChange={field.handleChange} />
                                        </F>
                                    </div>
                                )}
                            </form.Field>

                            {/* <form.Field name="responsibilities">
                                {(field) => (
                                    <div className="sm:col-span-2 min-w-[200px]">
                                        <F label="Key Responsibilities">
                                            <textarea
                                                value={field.state.value}
                                                onChange={e => field.handleChange(e.target.value)}
                                                rows={4}
                                                className="w-full min-w-[200px] rounded-sm border px-3 py-2 text-sm"
                                            />
                                        </F>
                                    </div>
                                )}
                            </form.Field> */}

                            <form.Field name="responsibilities">
                                {(field) => (
                                    <div className="sm:col-span-2">
                                        <F
                                            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                                            error={field.state.meta.errors?.[0]}
                                            label="Key Responsibilities"
                                        >
                                            <textarea
                                                id={field.name}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={e => field.handleChange(e.target.value)}
                                                placeholder="Describe your key responsibilities..."
                                                rows={4}
                                                className="w-full rounded-sm border border-input bg-brand-input px-2.5 py-3 text-sm outline-none resize-none placeholder:text-muted-foreground"
                                            />
                                        </F>
                                    </div>
                                )}
                            </form.Field>
                        </>
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

    if (isLoading) return <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>

    const defaults: Defaults = {
        academicGap: "",
        hasExperience: "no",
        jobTitle: "",
        organization: "",
        industry: "",
        country: "",
        startDate: "",
        endDate: "",
        responsibilities: "",
    }

    return <Step3Form key={JSON.stringify(defaults)} defaultValues={defaults} onBack={onBack} />
}