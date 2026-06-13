"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PhoneInputComponent } from "@/components/ui/phone-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Typography } from "@/components/shared/Typography"
import { useAuth } from "@/hooks/useAuth"
import { useQueryClient } from "@tanstack/react-query"
import { clearSessionQueryCache } from "@/lib/query/session-cache"
import { ErrorView } from "@/components/shared/error-view"
import { z } from "zod"

// Create a schema where title is required string (without default)
const signupFirstStepSchema = z.object({
    title: z.string(),
    firstName: z.string().trim().min(1, "First Name is Required").min(2, "First Name is Too Short").regex(/^[a-zA-Z]+$/, "Only letters allowed"),
    lastName: z.string().trim().min(1, "Last Name is Required").min(2, "Last Name is Too Short").regex(/^[a-zA-Z]+$/, "Only letters allowed"),
    email: z.string().trim().min(1, "Email is required").max(254, "Email too long").email("Invalid email format").transform((val) => val.toLowerCase()),
    phone: z.string().trim().min(1, "Phone is required").regex(/^\+?[\d\s\-\(\)]{8,30}$/, "Invalid phone number"),
    password: z.string().min(1, "Password is required").min(8, "At least 8 characters").max(128, "Password too long").regex(/[A-Z]/, "Must contain uppercase").regex(/[a-z]/, "Must contain lowercase").regex(/[0-9]/, "Must contain number").regex(/[^A-Za-z0-9]/, "Must contain special character"),
})


export function SignupFirstStep({ onNext }: { onNext: () => void }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [showPassword, setShowPassword] = useState(false)

    const role = searchParams.get("role") ?? "student"
    const normalizedRole = role.toUpperCase() as "STUDENT" | "AGENT"

    const queryClient = useQueryClient()
    const { signup } = useAuth()

    const form = useForm({
        defaultValues: {
            title: "",
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            password: "",
        },
        validators: { onSubmit: signupFirstStepSchema },

        onSubmit: async ({ value }) => {
            try {
                clearSessionQueryCache(queryClient)
                await signup.mutateAsync({
                    title: value.title,
                    firstName: value.firstName,
                    lastName: value.lastName,
                    email: value.email,
                    phone: value.phone,
                    password: value.password,
                    role: normalizedRole,
                })

                const params = new URLSearchParams(Array.from(searchParams.entries()))

                params.set("email", value.email)
                params.set("step", "2")

                router.replace(`?${params.toString()}`)
            } catch (e) {
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
                        <form.Field name="title">
                            {(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched &&
                                    !field.state.meta.isValid
                                const error = field.state.meta.errors?.[0]

                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Title
                                        </FieldLabel>
                                        <Select value={field.state.value} onValueChange={field.handleChange}>
                                            <SelectTrigger id={field.name}><SelectValue placeholder="Select title" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Mr">Mr</SelectItem>
                                                <SelectItem value="Mrs">Mrs</SelectItem>
                                                <SelectItem value="Ms">Ms</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {isInvalid && error && (
                                            <FieldError errors={[error]} />
                                        )}
                                    </Field>
                                )
                            }}
                        </form.Field>
                        <form.Field name="firstName">
                            {(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched &&
                                    !field.state.meta.isValid
                                const error = field.state.meta.errors?.[0]

                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            First Name
                                        </FieldLabel>
                                        <Input
                                            id={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) =>
                                                field.handleChange(e.target.value)
                                            }
                                            placeholder="Enter your first name"
                                            aria-invalid={isInvalid}
                                        />
                                        {isInvalid && error && (
                                            <FieldError errors={[error]} />
                                        )}
                                    </Field>
                                )
                            }}
                        </form.Field>

                        <form.Field name="lastName">
                            {(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched &&
                                    !field.state.meta.isValid
                                const error = field.state.meta.errors?.[0]

                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Last Name
                                        </FieldLabel>
                                        <Input
                                            id={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) =>
                                                field.handleChange(e.target.value)
                                            }
                                            placeholder="Enter your last name"
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
                                        <PhoneInputComponent
                                            className="w-full"
                                            value={field.state.value}
                                            onChange={(value) => field.handleChange(value)}
                                            placeholder="Enter your phone number"
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