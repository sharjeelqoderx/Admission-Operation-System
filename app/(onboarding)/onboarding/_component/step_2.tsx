"use client"

import { useForm } from "@tanstack/react-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "./_shared"
import { Typography } from "@/components/shared/Typography"
import { degreeStep2Schema } from "@/types/schemas/auth"
import type { z } from "zod"
import { F } from "./_shared"
import { useAuth } from "@/hooks/useAuth"
import { PageLoader } from "@/components/shared/page-loader"
import { useDegrees, formatDegreeLabel } from "@/hooks/useDegrees"
import {
    type AcademicFormItem,
    computePercentage,
    createEmptyAcademicItem,
    mapAcademicToFormItem,
} from "@/types/schemas/academic"

type Defaults = z.input<typeof degreeStep2Schema>

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

function Step2Form({ defaultValues, onBack, onNext }: { defaultValues: Defaults; onBack: () => void; onNext: () => void; onSkip: () => void }) {
    const { me, academic: saveAcademic } = useAuth()
    const { data: meData } = me
    const { data: degrees = [], isLoading: loadingDegrees } = useDegrees()

    const form = useForm({
        defaultValues,
        validators: { onSubmit: degreeStep2Schema },
        onSubmit: async ({ value }) => {
            if (!meData?.id) return
            await saveAcademic.mutateAsync({
                userId: meData.id,
                academics: value.academics.map((val) => ({
                    qualification: val.qualification,
                    instituteName: val.instituteName,
                    grade_type: val.grade_type,
                    gpa: val.grade_type === "gpa" ? parseFloat(val.gpa ?? "") : null,
                    obtained_marks: val.grade_type === "percentage" ? parseFloat(val.obtained_marks ?? "") : null,
                    total_marks: val.grade_type === "percentage" ? parseFloat(val.total_marks ?? "") : null,
                    start_date: val.start_date || undefined,
                    end_date: val.end_date || undefined,
                    about: val.about,
                })),
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

                                <form.Subscribe selector={(state) => state.values.academics[i]}>
                                    {(item) => {
                                        const isGpa = item?.grade_type === "gpa"
                                        const percentage = computePercentage(
                                            item?.obtained_marks ?? "",
                                            item?.total_marks ?? "",
                                        )

                                        return (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-2">
                                                {/* Highest Degree */}
                                                <form.Field name={`academics[${i}].qualification`}>
                                                    {(subField) => {
                                                        const { isInvalid, error } = getFieldState(subField)
                                                        return (
                                                        <F
                                                            isInvalid={isInvalid}
                                                            error={error}
                                                            label="Highest Degree"
                                                        >
                                                            <Select
                                                                value={subField.state.value}
                                                                onValueChange={subField.handleChange}
                                                                disabled={loadingDegrees}
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder={loadingDegrees ? "Loading..." : "Select degree"} />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {degrees.map((degree) => (
                                                                        <SelectItem key={degree.id} value={degree.id}>
                                                                            {formatDegreeLabel(degree)}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </F>
                                                        )
                                                    }}
                                                </form.Field>

                                                {/* Institute Name */}
                                                <form.Field name={`academics[${i}].instituteName`}>
                                                    {(subField) => {
                                                        const { isInvalid, error } = getFieldState(subField)
                                                        return (
                                                        <F
                                                            isInvalid={isInvalid}
                                                            error={error}
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
                                                        )
                                                    }}
                                                </form.Field>

                                                {/* Grade Type */}
                                                <form.Field name={`academics[${i}].grade_type`}>
                                                    {(subField) => {
                                                        const { isInvalid, error } = getFieldState(subField)
                                                        return (
                                                        <F
                                                            isInvalid={isInvalid}
                                                            error={error}
                                                            label="Grade Type"
                                                        >
                                                            <Select
                                                                value={subField.state.value}
                                                                onValueChange={(v: "percentage" | "gpa") => {
                                                                    subField.handleChange(v)
                                                                    if (v === "gpa") {
                                                                        form.setFieldValue(`academics[${i}].obtained_marks`, "")
                                                                        form.setFieldValue(`academics[${i}].total_marks`, "")
                                                                    } else {
                                                                        form.setFieldValue(`academics[${i}].gpa`, "")
                                                                    }
                                                                }}
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Select grade type" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="percentage">Percentage</SelectItem>
                                                                    <SelectItem value="gpa">GPA</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </F>
                                                        )
                                                    }}
                                                </form.Field>

                                                {isGpa ? (
                                                    <form.Field name={`academics[${i}].gpa`}>
                                                        {(subField) => {
                                                            const { isInvalid, error } = getFieldState(subField)
                                                            return (
                                                            <F
                                                                isInvalid={isInvalid}
                                                                error={error}
                                                                label="GPA"
                                                            >
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    max="4"
                                                                    value={subField.state.value}
                                                                    onBlur={subField.handleBlur}
                                                                    onChange={(e) => subField.handleChange(e.target.value)}
                                                                    placeholder="e.g. 3.50"
                                                                    className="w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                />
                                                            </F>
                                                            )
                                                        }}
                                                    </form.Field>
                                                ) : (
                                                    <>
                                                        <div className="space-y-2">
                                                            <Typography as="p" font="text" className="text-sm font-medium">
                                                                Percentage
                                                            </Typography>
                                                            <div className="flex h-12 w-full items-center rounded-md border border-input bg-brand-input px-3 text-sm">
                                                                <Typography as="span" font="text">
                                                                    {percentage ?? "—"}
                                                                </Typography>
                                                            </div>
                                                        </div>

                                                        <form.Field name={`academics[${i}].obtained_marks`}>
                                                            {(subField) => {
                                                                const { isInvalid, error } = getFieldState(subField)
                                                                return (
                                                                <F
                                                                    isInvalid={isInvalid}
                                                                    error={error}
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
                                                                )
                                                            }}
                                                        </form.Field>

                                                        <form.Field name={`academics[${i}].total_marks`}>
                                                            {(subField) => {
                                                                const { isInvalid, error } = getFieldState(subField)
                                                                return (
                                                                <F
                                                                    isInvalid={isInvalid}
                                                                    error={error}
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
                                                                )
                                                            }}
                                                        </form.Field>
                                                    </>
                                                )}

                                                <form.Field name={`academics[${i}].start_date`}>
                                                    {(subField) => {
                                                        const { isInvalid, error } = getFieldState(subField)
                                                        return (
                                                        <F
                                                            isInvalid={isInvalid}
                                                            error={error}
                                                            label="Start Date"
                                                        >
                                                            <DatePicker
                                                                value={subField.state.value ?? ""}
                                                                onChange={(val: string) => subField.handleChange(val)}
                                                            />
                                                        </F>
                                                        )
                                                    }}
                                                </form.Field>

                                                <form.Field name={`academics[${i}].end_date`}>
                                                    {(subField) => {
                                                        const { isInvalid, error } = getFieldState(subField)
                                                        return (
                                                        <F
                                                            isInvalid={isInvalid}
                                                            error={error}
                                                            label="End Date"
                                                        >
                                                            <DatePicker
                                                                value={subField.state.value ?? ""}
                                                                onChange={(val: string) => subField.handleChange(val)}
                                                            />
                                                        </F>
                                                        )
                                                    }}
                                                </form.Field>

                                                <form.Field name={`academics[${i}].about`}>
                                                    {(subField) => {
                                                        const { isInvalid, error } = getFieldState(subField)
                                                        return (
                                                        <div className="sm:col-span-2">
                                                            <F
                                                                isInvalid={isInvalid}
                                                                error={error}
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
                                                        )
                                                    }}
                                                </form.Field>
                                            </div>
                                        )
                                    }}
                                </form.Subscribe>
                            </div>
                        ))}
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

    const academics: AcademicFormItem[] = meData?.academic?.length
        ? meData.academic.map(mapAcademicToFormItem)
        : [createEmptyAcademicItem()]

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
