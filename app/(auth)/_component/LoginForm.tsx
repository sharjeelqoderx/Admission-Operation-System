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
import { useAuth } from "@/hooks/useAuth"
import { useQueryClient } from "@tanstack/react-query"
import { clearSessionQueryCache } from "@/lib/query/session-cache"
import { Eye, EyeOff } from "lucide-react"

export function LoginForm() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const { login } = useAuth()
    const [apiError, setApiError] = useState("")
    const [showPassword, setShowPassword] = useState(false)

    const form = useForm({
        defaultValues: { email: "", password: "" },
        validators: { onSubmit: loginSchema },
        onSubmit: async ({ value }) => {
            setApiError("")
            try {
                clearSessionQueryCache(queryClient)
                await login.mutateAsync({ email: value.email, password: value.password })
                router.push("/dashboard")
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
            className="w-full sm:max-w-[618px]"
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
                                            <div className="flex items-center justify-between">
                                                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                                                <Link href="/forget-password" className="text-xs text-primary hover:underline">
                                                    Forgot your password?
                                                </Link>
                                            </div>
                                            <div className="relative">
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    id={field.name} value={field.state.value}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => { field.handleChange(e.target.value); setApiError("") }}
                                                    placeholder="••••••••" aria-invalid={isInvalid}
                                                    className="pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword((prev) => !prev)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
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
                <Link href="/signup?role=partner" className="text-primary font-medium hover:underline">Sign Up</Link>
            </p>
        </BluryCard>
    )
}
