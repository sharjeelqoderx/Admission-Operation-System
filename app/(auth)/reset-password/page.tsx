"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { Lock } from "lucide-react"
import { useMutation } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { BluryCard } from "@/components/shared/blury-card"
import { Typography } from "@/components/shared/Typography"
import { resetPasswordSchema } from "@/types/schemas/auth"

async function post<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.error ?? "Request failed")
    return data.data
}

function ResetPasswordForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const email = searchParams.get("email") ?? ""
    const [apiError, setApiError] = useState("")
    const [success, setSuccess] = useState(false)

    const resetMutation = useMutation({
        mutationFn: (password: string) =>
            post("/api/auth/reset-password", { email, password }),
    })

    const form = useForm({
        defaultValues: { password: "", confirmPassword: "" },
        validators: { onSubmit: resetPasswordSchema },
        onSubmit: async ({ value }) => {
            setApiError("")
            try {
                await resetMutation.mutateAsync(value.password)
                setSuccess(true)
                setTimeout(() => router.push("/login"), 2000)
            } catch (e: any) {
                setApiError(e.message)
            }
        },
    })

    if (success) {
        return (
            <BluryCard isCentered={false} sharpCorners={[]} blurAmount="backdrop-blur-2xl" className="w-full sm:max-w-[480px] text-center space-y-4">
                <Typography as="h2" font="sub-heading" className="font-bold text-emerald-600">Password Updated!</Typography>
                <Typography as="p" font="text" className="text-muted-foreground">
                    Password updated successfully. Please login.
                </Typography>
            </BluryCard>
        )
    }

    return (
        <BluryCard isCentered={false} sharpCorners={[]} blurAmount="backdrop-blur-2xl" className="w-full sm:max-w-[618px]">
            <div className="w-full space-y-8">
                <div className="flex flex-col items-center text-center space-y-2">
                    <div className="size-14 rounded-full bg-brand/10 flex items-center justify-center mb-2">
                        <Lock className="size-7 text-brand" />
                    </div>
                    <Typography as="h2" font="sub-heading" className="font-bold">Set New Password</Typography>
                    <Typography as="p" font="text" className="text-muted-foreground">
                        Create a strong new password for your account.
                    </Typography>
                </div>

                <form id="reset-form" onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}>
                    <FieldGroup>
                        <form.Field name="password">{(field) => {
                            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                            const error = field.state.meta.errors?.[0]
                            return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor={field.name}>New Password</FieldLabel>
                                    <Input
                                        type="password" id={field.name} value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={e => { field.handleChange(e.target.value); setApiError("") }}
                                        placeholder="••••••••"
                                    />
                                    {isInvalid && error && <FieldError errors={[error]} />}
                                </Field>
                            )
                        }}</form.Field>

                        <form.Field name="confirmPassword">{(field) => {
                            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                            const error = field.state.meta.errors?.[0]
                            return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor={field.name}>Confirm Password</FieldLabel>
                                    <Input
                                        type="password" id={field.name} value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={e => { field.handleChange(e.target.value); setApiError("") }}
                                        placeholder="••••••••"
                                    />
                                    {isInvalid && error && <FieldError errors={[error]} />}
                                </Field>
                            )
                        }}</form.Field>
                    </FieldGroup>
                </form>

                {apiError && (
                    <Typography as="p" font="text" className="text-destructive text-sm">{apiError}</Typography>
                )}

                <form.Subscribe selector={s => s.isSubmitting}>{(isSubmitting) => (
                    <Button type="submit" form="reset-form" className="w-full" disabled={isSubmitting || resetMutation.isPending}>
                        {resetMutation.isPending ? "Updating..." : "Update Password"}
                    </Button>
                )}</form.Subscribe>
            </div>
        </BluryCard>
    )
}

export default function ResetPasswordPage() {
    return (
        <div className="size-full min-h-screen flex items-center justify-center p-8 sm:p-16">
            <Suspense>
                <ResetPasswordForm />
            </Suspense>
        </div>
    )
}
