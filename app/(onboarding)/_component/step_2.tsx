"use client"

import { useForm } from "@tanstack/react-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Typography } from "@/components/shared/Typography"
import { degreeStep2Schema } from "@/types/schemas/auth"
import { F, DEGREES, ENGLISH_TESTS, CAMPUSES } from "./_shared"
import { useAcademic, useMe } from "@/lib/hooks/useAuth"

type Defaults = { highestDegree: string; instituteName: string; gpa: string; desiredProgram: string; campus: string; englishTest: string; about: string }

function Step2Form({ defaultValues, onBack, onNext, onSkip }: { defaultValues: Defaults; onBack: () => void; onNext: () => void; onSkip: () => void }) {
    const { data: me } = useMe()
    const saveAcademic = useAcademic()

    const form = useForm({
        defaultValues,
        validators: { onSubmit: degreeStep2Schema },
        onSubmit: async ({ value }) => {
            if (!me?.id) return
            await saveAcademic.mutateAsync({ userId: me.id, qualification: value.highestDegree, instituteName: value.instituteName, gpa: Number(value.gpa), desiredProgram: value.desiredProgram, campus: value.campus, englishTest: value.englishTest, about: value.about })
            onNext()
        },
    })

    return (
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit() }}>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

                <form.Field name="highestDegree">
                    {(field) => (
                        <F
                            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                            error={field.state.meta.errors?.[0]}
                            label="Highest Degree"
                        >
                            <Select value={field.state.value} onValueChange={field.handleChange}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select degree" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DEGREES.map((d) => (
                                        <SelectItem key={d} value={d}>
                                            {d}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </F>
                    )}
                </form.Field>

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

                <form.Field name="gpa">
                    {(field) => (
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
                    )}
                </form.Field>

                <form.Field name="desiredProgram">
                    {(field) => (
                        <F
                            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                            error={field.state.meta.errors?.[0]}
                            label="Desired Program"
                        >
                            <Input
                                id={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="e.g. MBA"
                                className="w-full"
                            />
                        </F>
                    )}
                </form.Field>

                <form.Field name="campus">
                    {(field) => (
                        <F
                            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                            error={field.state.meta.errors?.[0]}
                            label="Campus"
                        >
                            <Select value={field.state.value} onValueChange={field.handleChange}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select campus" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CAMPUSES.map((c) => (
                                        <SelectItem key={c} value={c}>
                                            {c}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </F>
                    )}
                </form.Field>

                <form.Field name="englishTest">
                    {(field) => (
                        <F
                            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                            error={field.state.meta.errors?.[0]}
                            label="English Test"
                        >
                            <Select value={field.state.value} onValueChange={field.handleChange}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select test" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ENGLISH_TESTS.map((t) => (
                                        <SelectItem key={t} value={t}>
                                            {t}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </F>
                    )}
                </form.Field>

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
                                    className="w-full rounded-none border border-input bg-brand-input px-2.5 py-3 text-sm outline-none focus:ring-3 focus:ring-ring/50 resize-none placeholder:text-muted-foreground"
                                />
                            </F>
                        </div>
                    )}
                </form.Field>

            </div>

            {saveAcademic.isError && (
                <Typography
                    as="p"
                    font="text"
                    className="text-destructive text-sm mt-4 text-center sm:text-left"
                >
                    {saveAcademic.error?.message}
                </Typography>
            )}

            <div className="flex flex-wrap gap-3 mt-8">
                <Button type="button" variant="outline" className="flex-1 min-w-40" onClick={onBack}>
                    Back
                </Button>

                <Button
                    type="submit"
                    className="flex-1 min-w-40 uppercase"
                    disabled={saveAcademic.isPending}
                >
                    {saveAcademic.isPending ? "Saving..." : "Continue"}
                </Button>
            </div>

        </form>
    )
}

export function Step2Academic({ onBack, onNext, onSkip }: { onBack: () => void; onNext: () => void; onSkip: () => void }) {
    const { data: me, isLoading } = useMe()

    if (isLoading) return <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>

    const defaults: Defaults = {
        highestDegree: me?.academic?.highestDegree ?? "",
        instituteName: me?.academic?.instituteName ?? "",
        gpa: me?.academic?.gpa ?? "",
        desiredProgram: me?.academic?.desiredProgram ?? "",
        campus: me?.academic?.campus ?? "",
        englishTest: me?.academic?.englishTest ?? "",
        about: me?.academic?.about ?? "",
    }

    return <Step2Form key={JSON.stringify(defaults)} defaultValues={defaults} onBack={onBack} onNext={onNext} onSkip={onSkip} />
}
