"use client"

import { useForm } from "@tanstack/react-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Typography } from "@/components/shared/Typography"
import { degreeStep2Schema } from "@/types/schemas/auth"
import type { z } from "zod"
import { F } from "./_shared"
import { useAuth } from "@/hooks/useAuth"
import { FormPageSkeleton } from "@/components/shared/page-skeleton"
import { useDegrees, formatDegreeLabel } from "@/hooks/useDegrees"
import {
    type AcademicFormItem,
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

function Step2Form({ defaultValues, onBack, onNext }: { defaultValues: Defaults; onBack: () => void; onNext: () => void }) {
    const { me, academic: saveAcademic } = useAuth()
    const { data: meData, refetch: refetchMe } = me
    const { data: degrees = [], isLoading: loadingDegrees } = useDegrees()

    const form = useForm({
        defaultValues,
        validators: { onSubmit: degreeStep2Schema },
        onSubmit: async ({ value }) => {
            if (!meData?.id) return

            if (!form.state.isDirty) {
                onNext()
                return
            }

            await saveAcademic.mutateAsync({
                userId: meData.id,
                academics: value.academics.map((val) => ({
                    qualification: val.qualification,
                    instituteName: val.instituteName,
                    grade_type: val.grade_type,
                    gpa: val.grade_type === "gpa" ? parseFloat(val.gpa ?? "") : null,
                    obtained_marks: val.grade_type === "percentage" ? parseFloat(val.obtained_marks ?? "") : null,
                    total_marks: val.grade_type === "percentage" ? parseFloat(val.total_marks ?? "") : null,
                })),
            })
            await refetchMe()
            onNext()
        },
    })

    return (
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit() }}>
            <form.Field name="academics" mode="array">
                {(field) => (
                    <div className="space-y-6">
                        {field.state.value.map((_, i) => (
                            <form.Subscribe
                                key={i}
                                selector={(state) => state.values.academics[i]?.grade_type}
                            >
                                {(gradeType) => {
                                    const isGpa = gradeType === "gpa"

                                    return (
                                        <div className="flex flex-col md:flex-row flex-wrap gap-4">
                                            <form.Field name={`academics[${i}].qualification`}>
                                                {(subField) => {
                                                    const { isInvalid, error } = getFieldState(subField)
                                                    return (
                                                        <div className="flex-1 min-w-[200px]">
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
                                                                    <SelectTrigger className="h-12 w-full">
                                                                        <SelectValue placeholder={loadingDegrees ? "Loading..." : "Select highest degree"} />
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
                                                        </div>
                                                    )
                                                }}
                                            </form.Field>

                                            <form.Field name={`academics[${i}].instituteName`}>
                                                {(subField) => {
                                                    const { isInvalid, error } = getFieldState(subField)
                                                    return (
                                                        <div className="flex-1 min-w-[200px]">
                                                            <F
                                                                isInvalid={isInvalid}
                                                                error={error}
                                                                label="Institution Name"
                                                            >
                                                                <Input
                                                                    value={subField.state.value}
                                                                    onBlur={subField.handleBlur}
                                                                    onChange={(e) => subField.handleChange(e.target.value)}
                                                                    placeholder="Enter institution"
                                                                    className="w-full"
                                                                />
                                                            </F>
                                                        </div>
                                                    )
                                                }}
                                            </form.Field>

                                            <form.Field name={`academics[${i}].grade_type`}>
                                                {(subField) => {
                                                    const { isInvalid, error } = getFieldState(subField)
                                                    return (
                                                        <div className="flex-1 min-w-[160px]">
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
                                                                    <SelectTrigger className="h-12 w-full">
                                                                        <SelectValue placeholder="Select grade type" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="percentage">Percentage</SelectItem>
                                                                        <SelectItem value="gpa">GPA</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </F>
                                                        </div>
                                                    )
                                                }}
                                            </form.Field>

                                            {isGpa ? (
                                                <form.Field name={`academics[${i}].gpa`}>
                                                    {(subField) => {
                                                        const { isInvalid, error } = getFieldState(subField)
                                                        return (
                                                            <div className="flex-1 min-w-[140px]">
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
                                                                        placeholder="e.g. 3.5"
                                                                        className="w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                    />
                                                                </F>
                                                            </div>
                                                        )
                                                    }}
                                                </form.Field>
                                            ) : (
                                                <>
                                                    <form.Field name={`academics[${i}].obtained_marks`}>
                                                        {(subField) => {
                                                            const { isInvalid, error } = getFieldState(subField)
                                                            return (
                                                                <div className="flex-1 min-w-[140px]">
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
                                                                            onKeyDown={(e) => ["e", "E", "-", "+"].includes(e.key) && e.preventDefault()}
                                                                            placeholder="e.g. 850"
                                                                            className="w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                        />
                                                                    </F>
                                                                </div>
                                                            )
                                                        }}
                                                    </form.Field>

                                                    <form.Field name={`academics[${i}].total_marks`}>
                                                        {(subField) => {
                                                            const { isInvalid, error } = getFieldState(subField)
                                                            return (
                                                                <div className="flex-1 min-w-[140px]">
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
                                                                            onKeyDown={(e) => ["e", "E", "-", "+"].includes(e.key) && e.preventDefault()}
                                                                            placeholder="e.g. 1100"
                                                                            className="w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                        />
                                                                    </F>
                                                                </div>
                                                            )
                                                        }}
                                                    </form.Field>
                                                </>
                                            )}
                                        </div>
                                    )
                                }}
                            </form.Subscribe>
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

export function Step2Academic({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
    const { me } = useAuth()
    const { data: meData, isLoading } = me

    if (isLoading) return <FormPageSkeleton />

    const academics: AcademicFormItem[] = meData?.academic?.length
        ? meData.academic.map(mapAcademicToFormItem)
        : [createEmptyAcademicItem()]

    return (
        <Step2Form
            key={JSON.stringify(academics)}
            defaultValues={{ academics }}
            onBack={onBack}
            onNext={onNext}
        />
    )
}
