"use client"

import React from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "@tanstack/react-form"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup } from "@/components/ui/field"
import { Typography } from "@/components/shared/Typography"

import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp"

import { otpSchema } from "@/types/schemas/auth"
import { useAuth } from "@/hooks/useAuth"
import { ErrorView } from "@/components/shared/error-view"

function maskEmail(email: string) {
    const [name, domain] = email.split("@")
    if (!name) return email
    return `${name.slice(0, 2)}${"*".repeat(Math.max(name.length - 2, 0))}@${domain}`
}

export const OtpVerifySecondStep = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const email = searchParams.get("email") || ""

    const { verifyOtp, sendOtp } = useAuth()

    /* ---------------- FORM ---------------- */
    const form = useForm({
        defaultValues: { otp: "" },
        validators: { onSubmit: otpSchema },
        onSubmit: async ({ value }) => {
            try {
                await verifyOtp.mutateAsync({
                    email,
                    otp: value.otp,
                })
                const role = searchParams.get("role")
                const qs = new URLSearchParams({ sidebar: "false" })
                if (role === "partner" || role === "university-partner") qs.set("role", "partner")
                else if (role === "student") qs.set("role", "student")
                router.push(`/onboarding?${qs.toString()}`)
            } catch (err: any) {
                console.error(err.message)
            }
        },
    })

    /* ---------------- TIMER ---------------- */
    const FIRST_TIME = 60     // 1 min
    const RESEND_TIME = 120   // 2 min

    const [secondsLeft, setSecondsLeft] = React.useState(0)

    // 🔥 Start timer helper
    const startTimer = (duration: number) => {
        const end = Date.now() + duration * 1000
        localStorage.setItem("otp_end", String(end))
        setSecondsLeft(duration)
    }

    // 🔥 On mount → resume or first start
    React.useEffect(() => {
        const storedEnd = localStorage.getItem("otp_end")

        if (storedEnd) {
            const remaining = Math.floor((Number(storedEnd) - Date.now()) / 1000)
            if (remaining > 0) {
                setSecondsLeft(remaining)
                return
            }
        }

        // 👉 first time open → start 1 min
        startTimer(FIRST_TIME)
    }, [])

    // 🔥 Countdown
    React.useEffect(() => {
        if (secondsLeft <= 0) return

        const interval = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [secondsLeft])

    /* ---------------- RESEND ---------------- */
    const handleResend = async () => {
        try {
            await sendOtp.mutateAsync({ email })

            // ✅ ONLY after success
            startTimer(RESEND_TIME)

        } catch (err: any) {
            console.error(err.message)
        }
    }

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60)
        const s = sec % 60
        return `${m}:${s.toString().padStart(2, "0")}`
    }

    return (
        <div className="w-full space-y-10">

            <div className="flex justify-center">
                <Image
                    src="/vector/shield.png"
                    alt="OTP Verification"
                    width={110}
                    height={110}
                    priority
                />
            </div>

            <div className="space-y-4 text-center">
                <Typography font="sub-heading" className="capitalize">
                    authenticate your account
                </Typography>
                <Typography font="title">
                    Thanks for keeping your account secure.
                </Typography>
            </div>

            <Typography font="text-lg" className="text-center">
                Please confirm your account by entering the code sent to{" "}
                {maskEmail(email)}
            </Typography>

            {/* FORM */}
            <form
                id="otp-form"
                onSubmit={(e) => {
                    e.preventDefault()
                    form.handleSubmit()
                }}
            >
                <FieldGroup>
                    <form.Field name="otp">
                        {(field) => {
                            const isInvalid =
                                field.state.meta.isTouched &&
                                !field.state.meta.isValid

                            const error = field.state.meta.errors?.[0]

                            return (
                                <Field className="flex flex-col items-center">

                                    <InputOTP
                                        maxLength={8} // match OTP length
                                        value={field.state.value}
                                        onChange={field.handleChange}
                                        onBlur={field.handleBlur}
                                    >
                                        <InputOTPGroup className="mx-auto gap-2">
                                            {[...Array(8)].map((_, i) => (
                                                <InputOTPSlot key={i} index={i} />
                                            ))}
                                        </InputOTPGroup>
                                    </InputOTP>

                                    {isInvalid && error && (
                                        <FieldError errors={[error]} />
                                    )}

                                    {/* TIMER */}
                                    <div className="mt-4 text-sm text-center">
                                        {secondsLeft > 0 ? (
                                            <p className="text-muted-foreground">
                                                Resend in{" "}
                                                <span className="font-medium">
                                                    {formatTime(secondsLeft)}
                                                </span>
                                            </p>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleResend}
                                                className="text-primary font-medium hover:underline"
                                            >
                                                Resend OTP
                                            </button>
                                        )}
                                    </div>

                                </Field>
                            )
                        }}
                    </form.Field>
                </FieldGroup>
            </form>

            {verifyOtp.error && (
                <ErrorView message={verifyOtp.error.message} />
            )}

            {sendOtp.error && (
                <ErrorView message={sendOtp.error.message} />
            )}

            <form.Subscribe selector={(s) => s.isSubmitting}>
                {(isSubmitting) => (
                    <Button
                        type="submit"
                        form="otp-form"
                        className="w-full"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Verifying..." : "Verify"}
                    </Button>
                )}
            </form.Subscribe>

        </div>
    )
}

export default OtpVerifySecondStep