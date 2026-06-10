"use client"

import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { Loader2 } from "lucide-react"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DragDropCard, UploadedFile } from "@/components/shared/drag-drop-card"
import { fileWithinSizeLimit, MAX_FILE_SIZE_ERROR_MESSAGE, MAX_FILE_SIZE_LABEL } from "@/lib/constants/file-upload"
import { F } from "./_shared"
import { useAuth } from "@/hooks/useAuth"
import { PageLoader } from "@/components/shared/page-loader"

const EXPERIENCE_OPTIONS = [
    { label: "1 – 3 years", value: "1-3" },
    { label: "4 – 10 years", value: "4-10" },
    { label: "10+ years", value: "10+" },
]

type AgentStep2Values = {
    profilePicture: File | null
    idCardFront: File | null
    idCardBack: File | null
    professionalExperience: string
}

type ExistingKyc = {
    registrationCertificateUrl?: string | null
    idCardFrontUrl?: string | null
    idCardBackUrl?: string | null
}

function mapExperienceYears(years?: number | null) {
    if (years == null || years === 0) return ""
    if (years <= 3) return "1-3"
    if (years <= 10) return "4-10"
    return "10+"
}

function createSchema(existing: ExistingKyc) {
    const uploadField = (existingUrl?: string | null) =>
        z
            .union([z.instanceof(File), z.null()])
            .refine((file) => file !== null || !!existingUrl, "File is required")
            .refine(
                (file) => file === null || fileWithinSizeLimit(file),
                MAX_FILE_SIZE_ERROR_MESSAGE
            )

    return z.object({
        profilePicture: uploadField(existing.registrationCertificateUrl),
        idCardFront: uploadField(existing.idCardFrontUrl),
        idCardBack: uploadField(existing.idCardBackUrl),
        professionalExperience: z.string().min(1, "Select your experience range"),
    })
}

function getFieldState(field: {
    state: { meta: { isTouched: boolean; isValid: boolean; errors?: unknown[] } }
    form: { state: { isSubmitted: boolean } }
}) {
    const isInvalid = (field.state.meta.isTouched || field.form.state.isSubmitted) && !field.state.meta.isValid
    const raw = field.state.meta.errors?.[0]
    const error = raw == null
        ? undefined
        : typeof raw === "string"
            ? { message: raw }
            : (raw as { message?: string })
    return { isInvalid, error }
}

function toExistingFile(url?: string | null, name?: string) {
    if (!url) return null
    return { url, name }
}

function AgentStep2Form({
    defaultValues,
    existingKyc,
    onBack,
    onNext,
}: {
    defaultValues: AgentStep2Values
    existingKyc: ExistingKyc
    onBack: () => void
    onNext: () => void
}) {
    const { agentProfile } = useAuth()
    const [submitError, setSubmitError] = useState<string | null>(null)
    const form = useForm({
        defaultValues,
        validators: { onSubmit: createSchema(existingKyc) },
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
            } catch (e: unknown) {
                setSubmitError(e instanceof Error ? e.message : "Failed to save KYC")
            }
        },
    })

    return (
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit() }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">

                <div className="col-span-1 sm:col-span-2">
                    <form.Field name="profilePicture">{(field) => {
                        const { isInvalid, error } = getFieldState(field)
                        return (
                        <F isInvalid={isInvalid} error={error} label="Registration Certificate">
                            <DragDropCard
                                title="" description={`Upload your registration certificate (JPG, PNG — max ${MAX_FILE_SIZE_LABEL})`}
                                accept=".jpg,.jpeg,.png" multiple={false}
                                existingFile={toExistingFile(existingKyc.registrationCertificateUrl, "Registration certificate")}
                                onChange={(files: UploadedFile[]) => field.handleChange(files[0]?.file ?? null)}
                                className="border-0 shadow-none p-0 bg-transparent ring-0"
                            />
                        </F>
                        )
                    }}</form.Field>
                </div>

                <form.Field name="idCardFront">{(field) => {
                    const { isInvalid, error } = getFieldState(field)
                    return (
                    <F isInvalid={isInvalid} error={error} label="ID Card Front">
                        <DragDropCard
                            title="" description={`Upload ID card front (JPG, PNG, PDF — max ${MAX_FILE_SIZE_LABEL})`}
                            accept=".jpg,.jpeg,.png,.pdf" multiple={false}
                            existingFile={toExistingFile(existingKyc.idCardFrontUrl, "ID card front")}
                            onChange={(files: UploadedFile[]) => field.handleChange(files[0]?.file ?? null)}
                            className="border-0 shadow-none p-0 bg-transparent ring-0"
                            defaultBackgroundImage="/assets/id-card-front-example.svg"
                        />
                    </F>
                    )
                }}</form.Field>

                <form.Field name="idCardBack">{(field) => {
                    const { isInvalid, error } = getFieldState(field)
                    return (
                    <F isInvalid={isInvalid} error={error} label="ID Card Back">
                        <DragDropCard
                            title="" description={`Upload ID card back (JPG, PNG, PDF — max ${MAX_FILE_SIZE_LABEL})`}
                            accept=".jpg,.jpeg,.png,.pdf" multiple={false}
                            existingFile={toExistingFile(existingKyc.idCardBackUrl, "ID card back")}
                            onChange={(files: UploadedFile[]) => field.handleChange(files[0]?.file ?? null)}
                            className="border-0 shadow-none p-0 bg-transparent ring-0"
                            defaultBackgroundImage="/assets/id-card-back-example.svg"
                        />
                    </F>
                    )
                }}</form.Field>

                <div className="col-span-1 sm:col-span-2">
                    <form.Field name="professionalExperience">{(field) => {
                        const { isInvalid, error } = getFieldState(field)
                        return (
                        <F isInvalid={isInvalid} error={error} label="Professional Experience">
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
                        )
                    }}</form.Field>
                </div>

            </div>

            <div className="flex flex-wrap gap-3 mt-8">
                <Button type="button" variant="outline" className="flex-1 min-w-40" onClick={onBack} disabled={agentProfile.isPending}>
                    Back
                </Button>
                <Button type="submit" className="flex-1 min-w-40 capitalize gap-2" disabled={agentProfile.isPending}>
                    {agentProfile.isPending && <Loader2 className="size-4 animate-spin" />}
                    {agentProfile.isPending ? "Saving..." : "Continue"}
                </Button>
            </div>

            {submitError && (
                <div className="mt-4 text-sm text-destructive">
                    {submitError}
                </div>
            )}
        </form>
    )
}

export function AgentStep2({ onBack, onNext }: { onBack: () => void; onNext: () => void; onSkip: () => void }) {
    const { me } = useAuth()
    const { data: meData, isLoading } = me

    if (isLoading) {
        return <PageLoader label="Preparing your KYC details..." />
    }

    const agentProfile = meData?.profile as { experience_years?: number | null } | undefined
    const existingKyc: ExistingKyc = {
        registrationCertificateUrl: meData?.agentKyc?.registrationCertificateUrl ?? null,
        idCardFrontUrl: meData?.agentKyc?.idCardFrontUrl ?? null,
        idCardBackUrl: meData?.agentKyc?.idCardBackUrl ?? null,
    }

    const defaultValues: AgentStep2Values = {
        profilePicture: null,
        idCardFront: null,
        idCardBack: null,
        professionalExperience: mapExperienceYears(agentProfile?.experience_years),
    }

    return (
        <AgentStep2Form
            key={JSON.stringify({ defaultValues, existingKyc })}
            defaultValues={defaultValues}
            existingKyc={existingKyc}
            onBack={onBack}
            onNext={onNext}
        />
    )
}
