"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useEffect } from "react"

import { BluryCard } from "@/components/shared/blury-card"
import { SignupFirstStep } from "./SignupFirstStep"
import { OtpVerifySecondStep } from "./OtpVerifySecondStep"

export function SignupStepHandler() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const totalSteps = 2

    let step = Number(searchParams.get("step") || 1)

    if (step < 1) step = 1
    if (step > totalSteps) step = totalSteps

    const setStep = (newStep: number) => {
        const params = new URLSearchParams(Array.from(searchParams.entries()))
        params.set("step", String(newStep))

        router.replace(`${pathname}?${params.toString()}`)
    }

    const next = () => {
        if (step < totalSteps) setStep(step + 1)
    }

    const back = () => {
        if (step > 1) setStep(step - 1)
    }

    useEffect(() => {
        if (!searchParams.get("step")) {
            setStep(1)
        }
    }, [])

    return (
        <BluryCard
            isCentered={false}
            sharpCorners={[]}
            blurAmount="backdrop-blur-2xl"
            className="w-full sm:max-w-[618px] border-2 border-white rounded-xl shadow-none"
        >

            {/* <div className="mb-6 text-sm text-muted-foreground">
                    Step {step} of {totalSteps}
                </div> */}

            {step === 1 && <SignupFirstStep onNext={next} />}
            {step === 2 && <OtpVerifySecondStep />}  {/* onNext={next} onBack={back} */}

        </BluryCard>
    )
}

export default SignupStepHandler