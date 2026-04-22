"use client"

import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Typography } from "@/components/shared/Typography"
import { workExperienceSchema } from "@/types/schemas/auth"
import { F, DatePicker, COUNTRIES, INDUSTRIES } from "./_shared"
import { useExperience, useMe } from "@/lib/hooks/useAuth"

type Defaults = { academicGap: string; hasExperience: "yes" | "no"; jobTitle: string; organization: string; industry: string; country: string; startDate: string; endDate: string; responsibilities: string }

function Step3Form({ defaultValues, onBack }: { defaultValues: Defaults; onBack: () => void }) {
    const router = useRouter()
    const { data: me } = useMe()
    const saveExperience = useExperience()

    const form = useForm({
        defaultValues,
        validators: { onSubmit: workExperienceSchema },
        onSubmit: async ({ value }) => {
            if (!me?.id) return
            await saveExperience.mutateAsync({ userId: me.id, academicGap: Number(value.academicGap), hasExperience: value.hasExperience, name: value.jobTitle, organization: value.organization, industry: value.industry, country: value.country, startDate: value.startDate, endDate: value.endDate, responsibility: value.responsibilities })
            router.push("/home")
        },
    })

    return (
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit() }}>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

                {/* Academic Gap */}
                <form.Field name="academicGap">
                    {(field) => (
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
                                onKeyDown={e => {
                                    if (["e", "E", "+", "-", ".", "ArrowUp", "ArrowDown"].includes(e.key)) e.preventDefault()
                                }}
                                placeholder="e.g. 1"
                                className="w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                        </F>
                    )}
                </form.Field>

                {/* Experience Yes/No */}
                <form.Field name="hasExperience">
                    {(field) => (
                        <F
                            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                            error={field.state.meta.errors?.[0]}
                            label="Do you have professional work experience?"
                        >
                            <div className="flex flex-wrap gap-4 sm:gap-6 min-h-[50px] items-center">
                                {(["yes", "no"] as const).map(opt => (
                                    <label key={opt} className="flex items-center gap-2 cursor-pointer capitalize">
                                        <input
                                            type="radio"
                                            value={opt}
                                            checked={field.state.value === opt}
                                            onChange={() => field.handleChange(opt)}
                                            className="accent-brand-byzantine size-4"
                                        />
                                        {opt}
                                    </label>
                                ))}
                            </div>
                        </F>
                    )}
                </form.Field>

                {/* Conditional Fields */}
                <form.Subscribe selector={s => s.values.hasExperience}>
                    {(hasExp) => hasExp === "yes" ? (
                        <>

                            <form.Field name="jobTitle">
                                {(field) => (
                                    <F
                                        isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                                        error={field.state.meta.errors?.[0]}
                                        label="Job Title / Designation"
                                    >
                                        <Input
                                            id={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={e => field.handleChange(e.target.value)}
                                            placeholder="e.g. Software Engineer"
                                            className="w-full"
                                        />
                                    </F>
                                )}
                            </form.Field>

                            <form.Field name="organization">
                                {(field) => (
                                    <F
                                        isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                                        error={field.state.meta.errors?.[0]}
                                        label="Organization / Company Name"
                                    >
                                        <Input
                                            id={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={e => field.handleChange(e.target.value)}
                                            placeholder="e.g. Google"
                                            className="w-full"
                                        />
                                    </F>
                                )}
                            </form.Field>

                            <form.Field name="industry">
                                {(field) => (
                                    <F
                                        isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                                        error={field.state.meta.errors?.[0]}
                                        label="Industry / Sector"
                                    >
                                        <Select value={field.state.value} onValueChange={field.handleChange}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select industry" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {INDUSTRIES.map(i => (
                                                    <SelectItem key={i} value={i}>{i}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </F>
                                )}
                            </form.Field>

                            <form.Field name="country">
                                {(field) => (
                                    <F
                                        isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                                        error={field.state.meta.errors?.[0]}
                                        label="Country / Location"
                                    >
                                        <Select value={field.state.value} onValueChange={field.handleChange}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select country" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {COUNTRIES.map(c => (
                                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </F>
                                )}
                            </form.Field>

                            <form.Field name="startDate">
                                {(field) => (
                                    <F
                                        isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                                        error={field.state.meta.errors?.[0]}
                                        label="Start Date"
                                    >
                                        <DatePicker
                                            value={field.state.value}
                                            onChange={field.handleChange}
                                        />
                                    </F>
                                )}
                            </form.Field>

                            <form.Field name="endDate">
                                {(field) => (
                                    <F
                                        isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                                        error={field.state.meta.errors?.[0]}
                                        label="End Date"
                                    >
                                        <DatePicker
                                            value={field.state.value}
                                            onChange={field.handleChange}
                                        />
                                    </F>
                                )}
                            </form.Field>

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
                                                className="w-full rounded-none border border-input bg-brand-input px-2.5 py-3 text-sm outline-none focus:ring-3 focus:ring-ring/50 resize-none placeholder:text-muted-foreground"
                                            />
                                        </F>
                                    </div>
                                )}
                            </form.Field>

                        </>
                    ) : null}
                </form.Subscribe>

            </div>

            {/* Error */}
            {saveExperience.isError && (
                <Typography
                    as="p"
                    font="text"
                    className="text-destructive text-sm mt-4 text-center sm:text-left"
                >
                    {saveExperience.error?.message}
                </Typography>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mt-8">
                <Button type="button" variant="outline" className="flex-1 min-w-40" onClick={onBack}>
                    Back
                </Button>

                <Button
                    type="submit"
                    className="flex-1 min-w-40 uppercase"
                    disabled={saveExperience.isPending}
                >
                    {saveExperience.isPending ? "Saving..." : "Submit"}
                </Button>
            </div>

        </form>
    )
}

export function Step3Work({ onBack }: { onBack: () => void }) {
    const { data: me, isLoading } = useMe()

    if (isLoading) return <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>

    const exp = me?.experience
    const defaults: Defaults = {
        academicGap: exp?.academicGap ?? "",
        hasExperience: exp ? "yes" : "no",
        jobTitle: exp?.jobTitle ?? "",
        organization: exp?.organization ?? "",
        industry: exp?.industry ?? "",
        country: exp?.country ?? "",
        startDate: exp?.startDate ?? "",
        endDate: exp?.endDate ?? "",
        responsibilities: exp?.responsibilities ?? "",
    }

    return <Step3Form key={JSON.stringify(defaults)} defaultValues={defaults} onBack={onBack} />
}
