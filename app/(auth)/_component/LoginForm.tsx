"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { loginSchema } from "@/types/schemas/auth"
import { BluryCard } from "@/components/shared/blury-card"
import { Typography } from "@/components/shared/Typography"
// import { Checkbox } from "@/components/ui/checkbox"
import { useLogin } from "@/lib/hooks/useAuth"

export function LoginForm() {
    const router = useRouter()
    const login = useLogin()
    const [apiError, setApiError] = useState("")

    const form = useForm({
        defaultValues: { email: "", password: "", isRemember: false },
        validators: { onSubmit: loginSchema },
        onSubmit: async ({ value }) => {
            setApiError("")
            try {
                await login.mutateAsync({ email: value.email, password: value.password })
                router.push("/home")
                router.refresh()
            } catch (e: any) {
                setApiError(e.message)
            }
        },
    })

    return (
        <BluryCard
            isCentered={false}
            sharpCorners={[]}
            blurAmount={'backdrop-blur-2xl'}
            className="w-full sm:max-w-[618px] border-2 border-white rounded-xl shadow-none"
        >
            <div className="w-full space-y-10">
                <div>
                    <Typography as="h2" font="sub-heading" className="font-bold">
                        Sign in to your account
                    </Typography>
                    <Typography as="p" font="text">
                        Access the FHM International Admissions Platform
                    </Typography>
                </div>

                <div className="space-y-8">
                    <form id="login-form" onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}>
                        <FieldGroup>
                            <form.Field name="email">
                                {(field) => {
                                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                                    const error = field.state.meta.errors?.[0]
                                    return (
                                        <Field data-invalid={isInvalid}>
                                            <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                                            <Input
                                                id={field.name} value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => { field.handleChange(e.target.value); setApiError("") }}
                                                placeholder="Enter your email" aria-invalid={isInvalid}
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
                                            <Input
                                                type="password" id={field.name} value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => { field.handleChange(e.target.value); setApiError("") }}
                                                placeholder="••••••••" aria-invalid={isInvalid}
                                            />
                                            {isInvalid && error && <FieldError errors={[error]} />}
                                        </Field>
                                    )
                                }}
                            </form.Field>

                            {/* <form.Field name="isRemember">
                                {(field) => (
                                    <Field orientation="horizontal" className="items-center gap-2">
                                        <Checkbox
                                            id="remember"
                                            checked={field.state.value}
                                            onCheckedChange={(checked) => field.handleChange(checked === true)}
                                        />
                                        <FieldLabel htmlFor="remember" className="text-[18px]">Remember me</FieldLabel>
                                    </Field>
                                )}
                            </form.Field> */}
                        </FieldGroup>
                    </form>

                    {apiError && (
                        <Typography as="p" font="text" className="text-destructive text-sm capitalize">
                            {apiError}
                        </Typography>
                    )}

                    <form.Subscribe selector={(s) => s.isSubmitting}>
                        {(isSubmitting) => (
                            <Button type="submit" form="login-form" className="w-full capitalize" disabled={isSubmitting || login.isPending}>
                                {login.isPending ? "Signing in..." : "Login"}
                            </Button>
                        )}
                    </form.Subscribe>
                </div>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-4">
                Don&apos;t have an account?{" "}
                <Link href="/" className="text-primary font-medium hover:underline">Sign Up</Link>
            </p>
        </BluryCard>
    )
}
