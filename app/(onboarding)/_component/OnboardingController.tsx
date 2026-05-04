"use client"

import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { useAuth } from "@/hooks/useAuth"

import { Step1Basic } from "./step_1"
import { Step2Academic } from "./step_2"
import { Step3Work } from "./step_3"
import { AgentStep1 } from "./agent_step_1"
import { AgentStep2 } from "./agent_step_2"
import { AgentStep3 } from "./agent_step_3"

type Step = "welcome" | "step1" | "step2" | "step3"

const STUDENT_STEPS = [
    { key: "step1", label: "Basic" },
    { key: "step2", label: "Academic" },
    { key: "step3", label: "Experience" },
] as const

const AGENT_STEPS = [
    { key: "step1", label: "Profile" },
    { key: "step2", label: "KYC" },
    { key: "step3", label: "Contact" },
] as const

const STEP_INDEX: Record<Step, number> = { welcome: -1, step1: 0, step2: 1, step3: 2 }

const STUDENT_TITLES: Record<Step, string> = {
    welcome: "", step1: "Basic Information", step2: "Academic Background", step3: "Work Experience",
}
const AGENT_TITLES: Record<Step, string> = {
    welcome: "", step1: "Agent Profile", step2: "KYC / Verification", step3: "Contact",
}

function Stepper({ step, isAgent }: { step: Step; isAgent: boolean }) {
    const current = STEP_INDEX[step]
    const steps = isAgent ? AGENT_STEPS : STUDENT_STEPS
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Typography font="small" className="text-brand-blue uppercase">
                    Step {String(current + 1).padStart(2, "0")} of 03
                </Typography>

                <Typography as="h2" font="sub-heading" className="font-bold">
                    {(isAgent ? AGENT_TITLES : STUDENT_TITLES)[step]}
                </Typography>
            </div>

            <div className="flex gap-2">
                {steps.map((s, i) => (
                    <div key={s.key} className="flex-1 space-y-1.5">
                        <div className={cn(
                            "h-1.5 w-full rounded-full transition-colors duration-300",
                            i <= current ? "bg-brand-blue" : "bg-border"
                        )} />
                        {/* <p className={cn(
                            "text-xs font-medium transition-colors",
                            i === current ? "text-brand-blue" : i < current ? "text-brand-blue" : "text-brand-blue/50"
                        )}>
                            {s.label}
                        </p> */}
                    </div>
                ))}
            </div>
        </div>
    )
}

function OnboardingControllerInner() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { me } = useAuth()
    const { data: meData, isLoading } = me

    const step = (searchParams.get("step") ?? "welcome") as Step
    const isAgent = meData?.role?.toLowerCase() === "agent"

    const navigate = (s: Step, sidebar = true) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set("step", s)
        // params.set("sidebar", sidebar ? "true" : "false")
        params.delete("sidebar")
        router.replace(`/onboarding?${params.toString()}`)
    }

    if (isLoading) {
        return (
            <div className="size-full min-h-screen flex items-center justify-center">
                <div className="text-sm text-muted-foreground">Loading...</div>
            </div>
        )
    }

    if (step === "welcome") {
        return (
            <div className="size-full min-h-screen flex items-center justify-center p-8">
                <BluryCard
                    isCentered
                    blurAmount="backdrop-blur-2xl"
                    className="w-full max-w-[1000px]"
                >
                    <div className="flex flex-col items-center text-center space-y-6 py-4">
                        <Image src="/logo-dark.png" alt="FHM" width={180} height={54} />
                        <div className="space-y-2">
                            <Typography as="h2" font="sub-heading" className="font-bold">
                                You&apos;re One Step Closer
                            </Typography>
                            <Typography as="p" font="text" className="text-muted-foreground">
                                Complete your profile to unlock your personalised admissions dashboard.
                            </Typography>
                        </div>
                        <div className="flex flex-col gap-3 w-full">
                            <Button className="w-full capitalize" onClick={() => navigate("step1", true)}>
                                Start Creating your Profile
                            </Button>
                            {/* <Button variant="ghost" className="hover:bg-transparent" onClick={() => router.push("/dashboard")}>
                                Skip for now
                            </Button> */}
                        </div>
                    </div>
                </BluryCard>
            </div>
        )
    }

    return (
        <div className="size-full min-h-screen flex items-center justify-center p-8">
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-2xl"
                className="w-full max-w-[618px]"
            >
                <div className="space-y-6">
                    <Stepper step={step} isAgent={isAgent} />

                    {!isAgent && step === "step1" && (
                        <Step1Basic
                            onNext={() => navigate("step2")}
                            // onSkip={() => router.push("/dashboard")}
                        />
                    )}
                    {!isAgent && step === "step2" && (
                        <Step2Academic
                            onBack={() => navigate("step1")}
                            onNext={() => navigate("step3")}
                            onSkip={() => router.push("/dashboard")}
                        />
                    )}
                    {!isAgent && step === "step3" && (
                        <Step3Work onBack={() => navigate("step2")} />
                    )}

                    {isAgent && step === "step1" && (
                        <AgentStep1
                            onNext={() => navigate("step2")}
                            onSkip={() => router.push("/dashboard")}
                        />
                    )}
                    {isAgent && step === "step2" && (
                        <AgentStep2
                            onBack={() => navigate("step1")}
                            onNext={() => navigate("step3")}
                            onSkip={() => router.push("/dashboard")}
                        />
                    )}
                    {isAgent && step === "step3" && (
                        <AgentStep3 onBack={() => navigate("step2")} />
                    )}
                </div>
            </BluryCard>
        </div>
    )
}

export function OnboardingController() {
    return <Suspense><OnboardingControllerInner /></Suspense>
}
