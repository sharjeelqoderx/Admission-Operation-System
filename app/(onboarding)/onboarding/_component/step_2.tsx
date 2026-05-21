"use client"

import { useForm } from "@tanstack/react-form"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "./_shared"
import { Typography } from "@/components/shared/Typography"
import { degreeStep2Schema } from "@/types/schemas/auth"
import { F } from "./_shared"
import { useAuth } from "@/hooks/useAuth"
import { PageLoader } from "@/components/shared/page-loader"

type EducationType = { id: string; name: string; level: string }

type AcademicEntry = {
    degree_id: string
    instituteName: string
    obtained_marks: string
    total_marks: string
    start_date: string
    end_date: string
    about: string
}

type Defaults = { academics: AcademicEntry[] }

const EMPTY_ENTRY: AcademicEntry = {
    degree_id: "",
    instituteName: "",
    obtained_marks: "",
    total_marks: "",
    start_date: "",
    end_date: "",
    about: "",
}

function Step2Form({ defaultValues, onBack, onNext }: { defaultValues: Defaults; onBack: () => void; onNext: () => void; onSkip: () => void }) {
    const { me, academic: saveAcademic } = useAuth()
    const { data: meData } = me

    const { data: educationTypes = [], isLoading: loadingTypes } = useQuery<EducationType[]>({
        queryKey: ["education-types"],
        queryFn: async () => {
            const res = await fetch("/api/education")
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error ?? "Failed to load")
            return json.data
        },
    })

    const form = useForm({
        defaultValues,
        onSubmit: async ({ value }) => {
            if (!meData?.id) return
            const parsed = degreeStep2Schema.safeParse(value)
            if (!parsed.success) return
            await saveAcademic.mutateAsync({
                userId: meData.id,
                academics: parsed.data.academics.map(val => ({
                    degree_id: val.degree_id,
                    instituteName: val.instituteName,
                    obtained_marks: Number(val.obtained_marks),
                    total_marks: Number(val.total_marks),
                    start_date: val.start_date || undefined,
                    end_date: val.end_date || undefined,
                    about: val.about,
                }))
            })
            onNext()
        },
    })

    return (
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit() }}>
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

                                    {/* Degree dropdown */}
                                    <form.Field name={`academics[${i}].degree_id`}>
                                        {(subField) => (
                                            <F
                                                isInvalid={subField.state.meta.isTouched && !subField.state.meta.isValid}
                                                error={subField.state.meta.errors?.[0]}
                                                label="Highest Degree"
                                            >
                                                <Select
                                                    value={subField.state.value}
                                                    onValueChange={subField.handleChange}
                                                    disabled={loadingTypes}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder={loadingTypes ? "Loading..." : "Select degree"} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {educationTypes.map((et) => (
                                                            <SelectItem key={et.id} value={et.id}>
                                                                {et.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </F>
                                        )}
                                    </form.Field>

                                    {/* Institute Name */}
                                    <form.Field name={`academics[${i}].instituteName`}>
                                        {(subField) => (
                                            <F
                                                isInvalid={subField.state.meta.isTouched && !subField.state.meta.isValid}
                                                error={subField.state.meta.errors?.[0]}
                                                label="Institute Name"
                                            >
                                                <Input
                                                    value={subField.state.value}
                                                    onBlur={subField.handleBlur}
                                                    onChange={(e) => subField.handleChange(e.target.value)}
                                                    placeholder="e.g. University of Berlin"
                                                    className="w-full"
                                                />
                                            </F>
                                        )}
                                    </form.Field>

                                    {/* Obtained Marks */}
                                    <form.Field name={`academics[${i}].obtained_marks`}>
                                        {(subField) => (
                                            <F
                                                isInvalid={subField.state.meta.isTouched && !subField.state.meta.isValid}
                                                error={subField.state.meta.errors?.[0]}
                                                label="Obtained Marks"
                                            >
                                                <Input
                                                    type="number"
                                                    value={subField.state.value}
                                                    onBlur={subField.handleBlur}
                                                    onChange={(e) => subField.handleChange(e.target.value)}
                                                    onKeyDown={(e) => ["e", "E", "-", "+", "."].includes(e.key) && e.preventDefault()}
                                                    placeholder="e.g. 850"
                                                    className="w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                            </F>
                                        )}
                                    </form.Field>

                                    {/* Total Marks */}
                                    <form.Field name={`academics[${i}].total_marks`}>
                                        {(subField) => (
                                            <F
                                                isInvalid={subField.state.meta.isTouched && !subField.state.meta.isValid}
                                                error={subField.state.meta.errors?.[0]}
                                                label="Total Marks"
                                            >
                                                <Input
                                                    type="number"
                                                    value={subField.state.value}
                                                    onBlur={subField.handleBlur}
                                                    onChange={(e) => subField.handleChange(e.target.value)}
                                                    onKeyDown={(e) => ["e", "E", "-", "+", "."].includes(e.key) && e.preventDefault()}
                                                    placeholder="e.g. 1100"
                                                    className="w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                            </F>
                                        )}
                                    </form.Field>

                                    {/* About */}
                                    <form.Field name={`academics[${i}].start_date`}>
                                        {(subField) => (
                                            <F
                                                isInvalid={subField.state.meta.isTouched && !subField.state.meta.isValid}
                                                error={subField.state.meta.errors?.[0]}
                                                label="Start Date"
                                            >
                                                <DatePicker
                                                    value={subField.state.value ?? ""}
                                                    onChange={(val: string) => subField.handleChange(val)}
                                                />
                                            </F>
                                        )}
                                    </form.Field>

                                    <form.Field name={`academics[${i}].end_date`}>
                                        {(subField) => (
                                            <F
                                                isInvalid={subField.state.meta.isTouched && !subField.state.meta.isValid}
                                                error={subField.state.meta.errors?.[0]}
                                                label="End Date"
                                            >
                                                <DatePicker
                                                    value={subField.state.value ?? ""}
                                                    onChange={(val: string) => subField.handleChange(val)}
s                                                />
                                            </F>
                                        )}
                                    </form.Field>

                                    {/* About */}
                                    <form.Field name={`academics[${i}].about`}>
                                        {(subField) => (
                                            <div className="sm:col-span-2">
                                                <F
                                                    isInvalid={subField.state.meta.isTouched && !subField.state.meta.isValid}
                                                    error={subField.state.meta.errors?.[0]}
                                                    label="Why do you want to study here?"
                                                >
                                                    <textarea
                                                        value={subField.state.value}
                                                        onBlur={subField.handleBlur}
                                                        onChange={(e) => subField.handleChange(e.target.value)}
                                                        placeholder="Enter about your academic..."
                                                        rows={4}
                                                        className="w-full rounded-md border border-input bg-brand-input px-3 py-3 text-sm outline-none resize-none placeholder:text-muted-foreground"
                                                    />
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
                            onClick={() => field.pushValue({ ...EMPTY_ENTRY })}
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

    const academics: AcademicEntry[] = meData?.academic?.length
        ? meData.academic.map((a: any) => ({
            degree_id: a.degree_id ?? "",
            instituteName: a.instituteName ?? "",
            obtained_marks: a.obtained_marks ?? "",
            total_marks: a.total_marks ?? "",
            start_date: a.start_date ?? "",
            end_date: a.end_date ?? "",
            about: a.about ?? "",
        }))
        : [{ ...EMPTY_ENTRY }]

    return (
        <Step2Form
            key={JSON.stringify(academics)}
            defaultValues={{ academics }}
            onBack={onBack}
            onNext={onNext}
            onSkip={onSkip}
        />
    )
}
