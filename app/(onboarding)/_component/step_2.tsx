"use client"

import { useForm } from "@tanstack/react-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Typography } from "@/components/shared/Typography"
import { degreeStep2Schema } from "@/types/schemas/auth"
import { F } from "./_shared"
import { useAuth } from "@/hooks/useAuth"
import { PageLoader } from "@/components/shared/page-loader"

type Defaults = { highestDegree: string; instituteName: string; gpa: string; desiredProgram: string; campus: string; englishTest: string; about: string }

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
                qualification: value.highestDegree, 
                instituteName: value.instituteName, 
                gpa: Number(value.gpa), 
                desiredProgram: value.desiredProgram, 
                campus: value.campus, 
                englishTest: value.englishTest, 
                about: value.about 
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

                {/* Highest Degree */}
                <form.Field name="highestDegree">
                    {(field) => (
                        <F
                            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                            error={field.state.meta.errors?.[0]}
                            label="Highest Degree"
                        >
                            <Input
                                id={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="e.g. Bachelor's in Computer Science"
                                className="w-full"
                            />
                        </F>
                    )}
                </form.Field>

                {/* Institute */}
                <form.Field name="instituteName">
                    {(field) => (
                        <F
                            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                            error={field.state.meta.errors?.[0]}
                            label="Institute Name"
                        >
                            <Input
                                id={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="e.g. University of Berlin"
                                className="w-full"
                            />
                        </F>
                    )}
                </form.Field>

                {/* GPA → full width always */}
                <form.Field name="gpa">
                    {(field) => (
                        <div className="sm:col-span-2">
                            <F
                                isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                                error={field.state.meta.errors?.[0]}
                                label="GPA (0–4)"
                            >
                                <Input
                                    id={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder="e.g. 3.5"
                                    className="w-full"
                                />
                            </F>
                        </div>
                    )}
                </form.Field>

                {/* About */}
                <form.Field name="about">
                    {(field) => (
                        <div className="sm:col-span-2">
                            <F
                                isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                                error={field.state.meta.errors?.[0]}
                                label="Why do you want to study here?"
                            >
                                <textarea
                                    id={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder="Tell us about your plans..."
                                    rows={4}
                                    className="w-full rounded-md border border-input bg-brand-input px-3 py-3 text-sm outline-none resize-none placeholder:text-muted-foreground"
                                />
                            </F>
                        </div>
                    )}
                </form.Field>

            </div>

            {/* Error */}
            {saveAcademic.isError && (
                <Typography
                    as="p"
                    font="text"
                    className="text-destructive text-sm mt-4 text-center sm:text-left"
                >
                    {saveAcademic.error?.message}
                </Typography>
            )}

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto sm:flex-1"
                    onClick={onBack}
                >
                    Back
                </Button>

                <Button
                    type="submit"
                    className="w-full sm:w-auto sm:flex-1 capitalize"
                    disabled={saveAcademic.isPending}
                >
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

    const defaults: Defaults = {
        highestDegree: meData?.academic?.highestDegree ?? "",
        instituteName: meData?.academic?.instituteName ?? "",
        gpa: meData?.academic?.gpa ?? "",
        desiredProgram: "Invoked",
        campus: "Invoked", 
        englishTest: "Invoked", 
        about: meData?.academic?.about ?? "",
    }

    return <Step2Form key={JSON.stringify(defaults)} defaultValues={defaults} onBack={onBack} onNext={onNext} onSkip={onSkip} />
}
