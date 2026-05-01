"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { BluryCard } from "@/components/shared/blury-card"
import { Typography } from "@/components/shared/Typography"
import { signupSchema } from "@/types/schemas/auth"
import { useAuth } from "@/hooks/useAuth"
import { ErrorView } from "@/components/shared/error-view"


export function SignupFirstStep({ onNext }: { onNext: () => void }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [showPassword, setShowPassword] = useState(false)

    const role = searchParams.get("role") ?? "student"
    const normalizedRole = role.toUpperCase() as "STUDENT" | "AGENT"

    const { signup } = useAuth()

    const form = useForm({
        defaultValues: {
            fullName: "",
            email: "",
            phone: "",
            password: "",
        },
        validators: { onSubmit: signupSchema },

        onSubmit: async ({ value }) => {
            try {
                await signup.mutateAsync({
                    fullName: value.fullName,
                    email: value.email,
                    phone: value.phone,
                    password: value.password,
                    role: normalizedRole,
                })

                const params = new URLSearchParams(Array.from(searchParams.entries()))

                params.set("email", value.email)
                params.set("step", "2")

                router.replace(`?${params.toString()}`)
            } catch (e: any) {
                console.log('[signup error]', e)
            }
        },
    })

    return (
        <div className="w-full space-y-10">
            <div>
                <Typography as="h2" font="sub-heading" className="font-bold">
                    Sign up
                </Typography>
                <Typography as="p" font="text">
                    Get Started with FHM International Admissions
                </Typography>
            </div>

            {/* Form */}
            <div className="space-y-8">
                <form
                    id="signup-form"
                    onSubmit={(e) => {
                        e.preventDefault()
                        form.handleSubmit()
                    }}
                >
                    <FieldGroup>
                        <form.Field name="fullName">
                            {(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched &&
                                    !field.state.meta.isValid
                                const error = field.state.meta.errors?.[0]

                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Full Name
                                        </FieldLabel>
                                        <Input
                                            id={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) =>
                                                field.handleChange(e.target.value)
                                            }
                                            placeholder="Enter your full name"
                                            aria-invalid={isInvalid}
                                        />
                                        {isInvalid && error && (
                                            <FieldError errors={[error]} />
                                        )}
                                    </Field>
                                )
                            }}
                        </form.Field>

                        <form.Field name="email">
                            {(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched &&
                                    !field.state.meta.isValid
                                const error = field.state.meta.errors?.[0]

                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Email
                                        </FieldLabel>
                                        <Input
                                            id={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) =>
                                                field.handleChange(e.target.value)
                                            }
                                            placeholder="Enter your email"
                                            aria-invalid={isInvalid}
                                        />
                                        {isInvalid && error && (
                                            <FieldError errors={[error]} />
                                        )}
                                    </Field>
                                )
                            }}
                        </form.Field>

                        <form.Field name="phone">
                            {(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched &&
                                    !field.state.meta.isValid
                                const error = field.state.meta.errors?.[0]

                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Phone Number
                                        </FieldLabel>
                                        <Input
                                            id={field.name}
                                            type="number"
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) =>
                                                field.handleChange(e.target.value)
                                            }
                                            onKeyDown={(e) => {
                                                if (
                                                    ["e", "E", "-", ".", "ArrowUp", "ArrowDown"].includes(e.key)
                                                )
                                                    e.preventDefault()
                                            }}
                                            placeholder="Enter your phone number"
                                            aria-invalid={isInvalid}
                                            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        {isInvalid && error && (
                                            <FieldError errors={[error]} />
                                        )}
                                    </Field>
                                )
                            }}
                        </form.Field>

                        <form.Field name="password">
                            {(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched &&
                                    !field.state.meta.isValid
                                const error = field.state.meta.errors?.[0]

                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Password
                                        </FieldLabel>

                                        <div className="relative">
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                id={field.name}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) =>
                                                    field.handleChange(e.target.value)
                                                }
                                                placeholder="••••••••"
                                                aria-invalid={isInvalid}
                                                className="pr-10"
                                            />

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowPassword((prev) => !prev)
                                                }
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {showPassword ? (
                                                    <EyeOff size={18} />
                                                ) : (
                                                    <Eye size={18} />
                                                )}
                                            </button>
                                        </div>

                                        {isInvalid && error && (
                                            <FieldError errors={[error]} />
                                        )}
                                    </Field>
                                )
                            }}
                        </form.Field>

                    </FieldGroup>
                </form>

                {signup?.error && (
                    <ErrorView message={signup?.error?.message} />
                )}
                {/* {apiError && (
                    <Typography
                        as="p"
                        font="text"
                        className="text-destructive text-sm"
                    >
                        {apiError}
                    </Typography>
                )} */}

                <form.Subscribe selector={(s) => s.isSubmitting}>
                    {(isSubmitting) => (
                        <Button
                            type="submit"
                            form="signup-form"
                            className="w-full capitalize"
                            disabled={isSubmitting || signup.isPending}
                        >
                            {signup.isPending
                                ? "Creating account..."
                                : "Create Account"}
                        </Button>
                    )}
                </form.Subscribe>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-4">
                Already have an account?{" "}
                <Link
                    href="/login"
                    className="text-primary font-medium hover:underline"
                >
                    Login
                </Link>
            </p>
        </div>
    )
}

export default SignupFirstStep