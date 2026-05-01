"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "@tanstack/react-form"
import { Mail, CheckCircle } from "lucide-react"
import { useMutation } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { BluryCard } from "@/components/shared/blury-card"
import { Typography } from "@/components/shared/Typography"
import { forgotPasswordSchema } from "@/types/schemas/auth"

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

export function ForgotPasswordForm() {
    const [sent, setSent] = useState(false)
    const [sentEmail, setSentEmail] = useState("")
    const [apiError, setApiError] = useState("")

    const sendLink = useMutation({
        mutationFn: (email: string) =>
            post<{ message: string }>("/api/auth/forgot-password", { email }),
    })

    const form = useForm({
        defaultValues: { email: "" },
        validators: { onSubmit: forgotPasswordSchema },
        onSubmit: async ({ value }) => {
            setApiError("")
            try {
                await sendLink.mutateAsync(value.email)
                setSentEmail(value.email)
                setSent(true)
            } catch (e: any) {
                setApiError(e.message)
            }
        },
    })

    if (sent) {
        return (
            <BluryCard isCentered={false} sharpCorners={[]} blurAmount="backdrop-blur-2xl" className="w-full sm:max-w-[618px] border-2 border-white rounded-xl shadow-none">
                <div className="w-full space-y-6 text-center">
                    <div className="flex flex-col items-center space-y-2">
                        <div className="size-14 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
                            <CheckCircle className="size-7 text-emerald-500" />
                        </div>
                        <Typography as="h2" font="sub-heading" className="font-bold">Check your email</Typography>
                        <Typography as="p" font="text" className="text-muted-foreground">
                            We sent a password reset link to{" "}
                            <span className="font-semibold text-foreground">{sentEmail}</span>
                        </Typography>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        <Link href="/login" className="text-primary font-medium hover:underline">Back to Login</Link>
                    </p>
                </div>
            </BluryCard>
        )
    }

    return (
        <BluryCard isCentered={false} sharpCorners={[]} blurAmount="backdrop-blur-2xl" className="w-full sm:max-w-[618px] border-2 border-white rounded-xl shadow-none">
            <div className="w-full space-y-8">
                <div className="flex flex-col items-center text-center space-y-2">
                    <div className="size-14 rounded-full bg-brand/10 flex items-center justify-center mb-2">
                        <Mail className="size-7 text-brand" />
                    </div>
                    <Typography as="h2" font="sub-heading" className="font-bold">Forgot Password?</Typography>
                    <Typography as="p" font="text" className="text-muted-foreground">
                        Enter your email and we&apos;ll send you a reset link.
                    </Typography>
                </div>

                <form id="forgot-email-form" onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}>
                    <FieldGroup>
                        <form.Field name="email">{(field) => {
                            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                            const error = field.state.meta.errors?.[0]
                            return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor={field.name}>Email Address</FieldLabel>
                                    <Input
                                        id={field.name} value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={e => { field.handleChange(e.target.value); setApiError("") }}
                                        placeholder="Enter your email"
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
                    <Button type="submit" form="forgot-email-form" className="w-full" disabled={isSubmitting || sendLink.isPending}>
                        {sendLink.isPending ? "Sending..." : "Send Reset Link"}
                    </Button>
                )}</form.Subscribe>

                <p className="text-center text-sm text-muted-foreground">
                    <Link href="/login" className="text-primary font-medium hover:underline">Back to Login</Link>
                </p>
            </div>
        </BluryCard>
    )
}
