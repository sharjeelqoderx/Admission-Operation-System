"use client"

import { useForm } from "@tanstack/react-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Typography } from "@/components/shared/Typography"
import { degreeStep2Schema } from "@/types/schemas/auth"
import { F } from "./_shared"
import { useAuth } from "@/hooks/useAuth"
import { PageLoader } from "@/components/shared/page-loader"

type Defaults = { academics: Array<{ highestDegree: string; instituteName: string; gpa: string; desiredProgram: string; campus: string; englishTest: string; about: string }> }

function Step2Form({ defaultValues, onBack, onNext }: { defaultValues: Defaults; onBack: () => void; onNext: () => void; onSkip: () => void }) {
    const { me, academic: saveAcademic } = useAuth()
    const { data: meData } = me

    const form = useForm({
        defaultValues,
        validators: { onSubmit: degreeStep2Schema },
        onSubmit: async ({ value }) => {
            if (!meData?.id) return
            await saveAcademic.mutateAsync({
                userId: meData.id,
                academics: value.academics.map(val => ({
                    qualification: val.highestDegree,
                    instituteName: val.instituteName,
                    gpa: Number(val.gpa),
                    desiredProgram: val.desiredProgram,
                    campus: val.campus,
                    englishTest: val.englishTest,
                    about: val.about
                }))
            })
            onNext()
        },
    })

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                form.handleSubmit()
            }}
        >
            <form.Field name="academics" mode="array">
                {(field) => (
                    <div className="space-y-8">
                        {field.state.value.map((_, i) => (
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
                                    <form.Field name={`academics[${i}].highestDegree`}>
                                        {(subField) => (
                                            <F isInvalid={subField.state.meta.isTouched && !subField.state.meta.isValid} error={subField.state.meta.errors?.[0]} label="Highest Degree">
                                                <Input value={subField.state.value} onBlur={subField.handleBlur} onChange={(e) => subField.handleChange(e.target.value)} placeholder="e.g. Bachelor's in Computer Science" className="w-full" />
                                            </F>
                                        )}
                                    </form.Field>

                                    <form.Field name={`academics[${i}].instituteName`}>
                                        {(subField) => (
                                            <F isInvalid={subField.state.meta.isTouched && !subField.state.meta.isValid} error={subField.state.meta.errors?.[0]} label="Institute Name">
                                                <Input value={subField.state.value} onBlur={subField.handleBlur} onChange={(e) => subField.handleChange(e.target.value)} placeholder="e.g. University of Berlin" className="w-full" />
                                            </F>
                                        )}
                                    </form.Field>

                                    <form.Field name={`academics[${i}].gpa`}>
                                        {(subField) => (
                                            <div className="sm:col-span-2">
                                                <F isInvalid={subField.state.meta.isTouched && !subField.state.meta.isValid} error={subField.state.meta.errors?.[0]} label="GPA (0–4)">
                                                    <Input value={subField.state.value} onBlur={subField.handleBlur} onChange={(e) => subField.handleChange(e.target.value)} placeholder="Enter you GPA" className="w-full" />
                                                </F>
                                            </div>
                                        )}
                                    </form.Field>

                                    <form.Field name={`academics[${i}].desiredProgram`}>
                                        {(subField) => <input type="hidden" value={subField.state.value} />}
                                    </form.Field>
                                    <form.Field name={`academics[${i}].campus`}>
                                        {(subField) => <input type="hidden" value={subField.state.value} />}
                                    </form.Field>
                                    <form.Field name={`academics[${i}].englishTest`}>
                                        {(subField) => <input type="hidden" value={subField.state.value} />}
                                    </form.Field>

                                    <form.Field name={`academics[${i}].about`}>
                                        {(subField) => (
                                            <div className="sm:col-span-2">
                                                <F isInvalid={subField.state.meta.isTouched && !subField.state.meta.isValid} error={subField.state.meta.errors?.[0]} label="Why do you want to study here?">
                                                    <textarea value={subField.state.value} onBlur={subField.handleBlur} onChange={(e) => subField.handleChange(e.target.value)} placeholder="Enter about your academic..." rows={4} className="w-full rounded-md border border-input bg-brand-input px-3 py-3 text-sm outline-none resize-none placeholder:text-muted-foreground" />
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
                            onClick={() => field.pushValue({ highestDegree: "", instituteName: "", gpa: "", desiredProgram: "Invoked", campus: "Invoked", englishTest: "Invoked", about: "" })}
                        >
                            + Add another education
                        </Button>
                    </div>
                )}
            </form.Field>

            {saveAcademic.isError && (
                <Typography as="p" font="text" className="text-destructive text-sm mt-4 text-center sm:text-left">
                    {saveAcademic.error?.message}
                </Typography>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <Button type="button" variant="outline" className="w-full sm:w-auto sm:flex-1" onClick={onBack}>
                    Back
                </Button>
                <Button type="submit" className="w-full sm:w-auto sm:flex-1 capitalize" disabled={saveAcademic.isPending}>
                    {saveAcademic.isPending ? "Saving..." : "Continue"}
                </Button>
            </div>
        </form>
    )
}

export function Step2Academic({ onBack, onNext, onSkip }: { onBack: () => void; onNext: () => void; onSkip: () => void }) {
    const { me } = useAuth()
    const { data: meData, isLoading } = me

    if (isLoading) return <PageLoader label="Loading academic details..." />

    const academics = meData?.academic?.length ? meData.academic.map(a => ({
        highestDegree: a.highestDegree ?? "",
        instituteName: a.instituteName ?? "",
        gpa: a.gpa ?? "",
        desiredProgram: "Invoked",
        campus: "Invoked",
        englishTest: "Invoked",
        about: a.about ?? "",
    })) : [{
        highestDegree: "",
        instituteName: "",
        gpa: "",
        desiredProgram: "Invoked",
        campus: "Invoked",
        englishTest: "Invoked",
        about: "",
    }]

    const defaults: Defaults = { academics }

    return <Step2Form key={JSON.stringify(defaults)} defaultValues={defaults} onBack={onBack} onNext={onNext} onSkip={onSkip} />
}
