"use client"

import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DragDropCard, UploadedFile } from "@/components/shared/drag-drop-card"
import { F } from "./_shared"
import { useAuth } from "@/hooks/useAuth"

const EXPERIENCE_OPTIONS = [
    { label: "1 – 3 years", value: "1-3" },
    { label: "4 – 10 years", value: "4-10" },
    { label: "10+ years", value: "10+" },
]

const schema = z.object({
    profilePicture: z.instanceof(File).nullable().refine(f => f !== null, "Profile picture is required"),
    idCardFront: z.instanceof(File).nullable().refine(f => f !== null, "ID card front is required"),
    idCardBack: z.instanceof(File).nullable().refine(f => f !== null, "ID card back is required"),
    professionalExperience: z.string().min(1, "Select your experience range"),
})

export function AgentStep2({ onBack, onNext, onSkip }: { onBack: () => void; onNext: () => void; onSkip: () => void }) {
    const { agentProfile } = useAuth()
    const [submitError, setSubmitError] = useState<string | null>(null)
    const form = useForm({
        defaultValues: {
            profilePicture: null as File | null,
            idCardFront: null as File | null,
            idCardBack: null as File | null,
            professionalExperience: "",
        },
        validators: { onSubmit: schema },
        onSubmit: async ({ value }) => {
            setSubmitError(null)
            try {
                const years =
                    value.professionalExperience === "1-3"
                        ? 2
                        : value.professionalExperience === "4-10"
                            ? 7
                            : 10

                const fd = new FormData()
                fd.append("experience_years", String(years))
                if (value.profilePicture) fd.append("registration_certificate", value.profilePicture)
                if (value.idCardFront) fd.append("id_card_front", value.idCardFront)
                if (value.idCardBack) fd.append("id_card_back", value.idCardBack)

                await agentProfile.mutateAsync(fd)
                onNext()
            } catch (e: any) {
                setSubmitError(e?.message ?? "Failed to save KYC")
            }
        },
    })

    return (
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit() }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">

                {/* Profile Picture */}
                <div className="col-span-1 sm:col-span-2">
                    <form.Field name="profilePicture">{(field) => (
                        <F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Registration Certificate">
                            <DragDropCard
                                title="" description="Upload your registration certificate (JPG, PNG — max 2MB)"
                                accept=".jpg,.jpeg,.png" multiple={false} maxSizeMB={2}
                                onChange={(files: UploadedFile[]) => field.handleChange(files[0]?.file ?? null)}
                                className="border-0 shadow-none p-0 bg-transparent ring-0"
                            />
                        </F>
                    )}</form.Field>
                </div>

                {/* Passport */}
                {/* <form.Field name="passport">{(field) => (
                    <F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Passport">
                        <DragDropCard
                            title="" description="Upload passport (PDF, JPG, PNG — max 5MB)"
                            accept=".pdf,.jpg,.jpeg,.png" multiple={false} maxSizeMB={5}
                            onChange={(files: UploadedFile[]) => field.handleChange(files[0]?.file ?? null)}
                            className="border-0 shadow-none p-0 bg-transparent ring-0"
                        />
                    </F>
                )}</form.Field> */}

                {/* ID Card Front */}
                <form.Field name="idCardFront">{(field) => (
                    <F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="ID Card Front">
                        <DragDropCard
                            title="" description="Upload ID card front (JPG, PNG — max 5MB)"
                            accept=".jpg,.jpeg,.png,.pdf" multiple={false} maxSizeMB={5}
                            onChange={(files: UploadedFile[]) => field.handleChange(files[0]?.file ?? null)}
                            className="border-0 shadow-none p-0 bg-transparent ring-0"
                        />
                    </F>
                )}</form.Field>

                {/* ID Card Back */}
                <form.Field name="idCardBack">{(field) => (
                    <F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="ID Card Back">
                        <DragDropCard
                            title="" description="Upload ID card back (JPG, PNG — max 5MB)"
                            accept=".jpg,.jpeg,.png,.pdf" multiple={false} maxSizeMB={5}
                            onChange={(files: UploadedFile[]) => field.handleChange(files[0]?.file ?? null)}
                            className="border-0 shadow-none p-0 bg-transparent ring-0"
                        />
                    </F>
                )}</form.Field>

                {/* Professional Experience */}
                <div className="col-span-1 sm:col-span-2">
                    <form.Field name="professionalExperience">{(field) => (
                        <F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Professional Experience">
                            <div className="flex gap-3">
                                {EXPERIENCE_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => field.handleChange(opt.value)}
                                        className={cn(
                                            "flex-1 h-[50px] rounded-none border text-sm font-medium transition-colors",
                                            field.state.value === opt.value
                                                ? "border-brand-byzantine bg-brand-byzantine text-white"
                                                : "border-input bg-brand-input text-foreground hover:border-brand/50"
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </F>
                    )}</form.Field>
                </div>

            </div>

            <div className="flex flex-wrap gap-3 mt-8">
                <Button type="button" variant="outline" className="flex-1 min-w-40" onClick={onBack}>Back</Button>
                {/* <Button type="button" variant="ghost" className="flex-1 hover:bg-transparent" onClick={onSkip}>Skip</Button> */}
                <Button type="submit" className="flex-1 min-w-40 capitalize">Continue</Button>
            </div>

            {submitError && (
                <div className="mt-4 text-sm text-destructive">
                    {submitError}
                </div>
            )}
        </form>
    )
}
