"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams, useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { BluryCard } from "@/components/shared/blury-card"
import { Typography } from "@/components/shared/Typography"
import { signupSchema } from "@/types/schemas/auth"
import { useSignup } from "@/lib/hooks/useAuth"

function CheckEmailScreen({ email, role }: { email: string, role: string }) {
    return (
        <div className="flex flex-col items-center text-center space-y-6 py-4">
            <div className="size-20 rounded-full bg-brand/10 flex items-center justify-center">
                <Mail className="size-10 text-brand" />
            </div>
            <Image src="/logo-dark.png" alt="FHM" width={140} height={42} />
            <div className="space-y-2">
                <Typography as="h2" font="sub-heading" className="font-bold">
                    Check your email
                </Typography>
                <Typography as="p" font="text" className="text-muted-foreground">
                    We sent a verification link to{" "}
                    <span className="font-semibold text-foreground">{email}</span>.
                    Click the link to verify your account.
                </Typography>
            </div>
            <Typography as="p" font="text" className="text-xs text-muted-foreground">
                Didn&apos;t receive it? Check your spam folder or{" "}
                <Link
                    href={{
                        pathname: "/signup",
                        query: { role },
                    }}
                    className="text-primary underline underline-offset-2">
                    try again
                </Link>
                .
            </Typography>
        </div>
    )
}

export function SignupForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const role = searchParams.get("role") ?? "student"
    const normalizedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
    const submittedEmail = searchParams.get("email") ?? ""

    const signup = useSignup()
    const [apiError, setApiError] = useState("")

    const form = useForm({
        defaultValues: { fullName: "", email: "", phone: "", password: "" },
        validators: { onSubmit: signupSchema },
        onSubmit: async ({ value }) => {
            setApiError("")
            try {
                await signup.mutateAsync({
                    fullName: value.fullName,
                    email: value.email,
                    phone: value.phone,
                    password: value.password,
                    role: normalizedRole,
                })
                const params = new URLSearchParams(searchParams.toString())
                params.set("email", value.email)
                router.push(`?${params.toString()}`)
            } catch (e: any) {
                setApiError(e.message)
            }
        },
    })

    if (submittedEmail) {
        return (
            <BluryCard blurAmount="backdrop-blur-2xl" isCentered={false} sharpCorners={[]} className="w-full sm:max-w-[618px] border-2 border-white rounded-xl shadow-none">
                <CheckEmailScreen role={role} email={submittedEmail} />
            </BluryCard>
        )
    }

    return (
        <BluryCard blurAmount="backdrop-blur-2xl" isCentered={false} sharpCorners={[]} className="w-full sm:max-w-[618px] border-2 border-white rounded-xl shadow-none">
            <div className="w-full space-y-10">
                <div>
                    <Typography as="h2" font="sub-heading" className="font-bold">
                        Create your account
                    </Typography>
                    <Typography as="p" font="text">
                        Join the FHM International Admissions Platform
                    </Typography>
                </div>

                <div className="space-y-8">
                    <form id="signup-form" onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}>
                        <FieldGroup>
                            <form.Field name="fullName">
                                {(field) => {
                                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                                    const error = field.state.meta.errors?.[0]
                                    return (
                                        <Field data-invalid={isInvalid}>
                                            <FieldLabel htmlFor={field.name}>Full Name</FieldLabel>
                                            <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} placeholder="John Doe" aria-invalid={isInvalid} />
                                            {isInvalid && error && <FieldError errors={[error]} />}
                                        </Field>
                                    )
                                }}
                            </form.Field>

                            <form.Field name="email">
                                {(field) => {
                                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                                    const error = field.state.meta.errors?.[0]
                                    return (
                                        <Field data-invalid={isInvalid}>
                                            <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                                            <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} placeholder="you@example.com" aria-invalid={isInvalid} />
                                            {isInvalid && error && <FieldError errors={[error]} />}
                                        </Field>
                                    )
                                }}
                            </form.Field>

                            <form.Field name="phone">
                                {(field) => {
                                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                                    const error = field.state.meta.errors?.[0]
                                    return (
                                        <Field data-invalid={isInvalid}>
                                            <FieldLabel htmlFor={field.name}>Phone</FieldLabel>
                                            <Input
                                                id={field.name} type="number" value={field.state.value}
                                                onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)}
                                                onKeyDown={(e) => { if (["e", "E", "+", "-", ".", "ArrowUp", "ArrowDown"].includes(e.key)) e.preventDefault() }}
                                                placeholder="+1234567890" aria-invalid={isInvalid}
                                                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                            {isInvalid && error && <FieldError errors={[error]} />}
                                        </Field>
                                    )
                                }}
                            </form.Field>

                            <form.Field name="password">
                                {(field) => {
                                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                                    const error = field.state.meta.errors?.[0]
                                    return (
                                        <Field data-invalid={isInvalid}>
                                            <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                                            <Input type="password" id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} placeholder="••••••••" aria-invalid={isInvalid} />
                                            {isInvalid && error && <FieldError errors={[error]} />}
                                        </Field>
                                    )
                                }}
                            </form.Field>
                        </FieldGroup>
                    </form>

                    {apiError && (
                        <Typography as="p" font="text" className="text-destructive text-sm">
                            {apiError}
                        </Typography>
                    )}

                    <form.Subscribe selector={(s) => s.isSubmitting}>
                        {(isSubmitting) => (
                            <Button type="submit" form="signup-form" className="w-full uppercase" disabled={isSubmitting || signup.isPending}>
                                {signup.isPending ? "Creating account..." : "Create Account"}
                            </Button>
                        )}
                    </form.Subscribe>
                </div>

                <p className="text-center text-sm text-muted-foreground mt-4">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary font-medium hover:underline">Login</Link>
                </p>
            </div>
        </BluryCard>
    )
}
