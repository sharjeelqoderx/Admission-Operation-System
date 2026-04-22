"use client"

import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"

import { Step1Basic } from "../_component/step_1"
import { Step2Academic } from "../_component/step_2"
import { Step3Work } from "../_component/step_3"
import { AgentStep1 } from "../_component/agent_step_1"
import { AgentStep2 } from "../_component/agent_step_2"
import { AgentStep3 } from "../_component/agent_step_3"

type Screen = "success" | "step1" | "step2" | "step3"

const STUDENT_STEPS = [{ key: "step1", label: "Basic" }, { key: "step2", label: "Academic" }, { key: "step3", label: "Experience" }] as const
const AGENT_STEPS = [{ key: "step1", label: "Agency" }, { key: "step2", label: "Contact" }, { key: "step3", label: "Business" }] as const
const STEP_INDEX: Record<Screen, number> = { success: -1, step1: 0, step2: 1, step3: 2 }

const STUDENT_META: Record<Screen, string> = { success: "", step1: "Basic Information", step2: "Academic Background", step3: "Work Experience" }
const AGENT_META: Record<Screen, string> = { success: "", step1: "Agency Information", step2: "Contact & Representative", step3: "Business Details" }

function Stepper({ screen, isAgent }: { screen: Screen; isAgent: boolean }) {
    const current = STEP_INDEX[screen]
    const steps = isAgent ? AGENT_STEPS : STUDENT_STEPS
    return (
        <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                Step {String(current + 1).padStart(2, "0")} of 03
            </p>
            <div className="flex gap-2">
                {steps.map((step, i) => (
                    <div key={step.key} className="flex-1 space-y-1.5">
                        <div className={cn("h-1.5 w-full rounded-full transition-colors duration-300", i <= current ? "bg-brand-byzantine" : "bg-border")} />
                        <p className={cn("text-xs font-medium", i === current ? "text-brand-byzantine" : i < current ? "text-muted-foreground" : "text-muted-foreground/50")}>
                            {step.label}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    )
}

function ProfileContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const role = searchParams.get("role") ?? "Student"
    const isAgent = role.toLowerCase() === "agent"

    const screenParam = (searchParams.get("screen") ?? "success") as Screen

    const setScreen = (s: Screen) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set("screen", s)
        router.replace(`/profile?${params.toString()}`)
    }

    const startProfile = () => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete("noSidebar")
        params.set("screen", "step1")
        router.replace(`/profile?${params.toString()}`)
    }

    const skipProfile = () => {
        router.push("/home")
    }

    const screen = screenParam
    const meta = isAgent ? AGENT_META : STUDENT_META

    // Success screen — full screen fixed overlay with blurry bg, hides sidebar
    if (screen === "success") {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 app-bg">
                <BluryCard
                    isCentered={true}
                    blurAmount="backdrop-blur-2xl"
                    className="size-full sm:max-w-[940px] border-2 border-white rounded-xl shadow-none"

                >
                    <div className="flex flex-col items-center text-center space-y-6 py-4">
                        {/* <div className="size-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle className="size-10 text-emerald-500" />
                        </div> */}
                        <Image src="/logo-dark.png" alt="FHM" width={256} height={80} />
                        <div className="space-y-4">
                            <Typography as="h2" font="sub-heading" className="font-bold">you’re One Step Closer</Typography>
                            <Typography as="p" font="text">
                                Welcome to the next generation of admissions. Complete your basic profile now to unlock our Eligibility Engine and see exactly where you qualify to study.                            </Typography>
                        </div>
                        <div className="flex flex-col gap-3 w-full">
                            <Button className="w-full capitalize" onClick={startProfile}>
                                Start Creating your Profile
                            </Button>
                            {/* <Button variant="ghost" className="hover:bg-transparent" onClick={skipProfile}>
                                Skip for now
                            </Button> */}
                        </div>
                    </div>
                </BluryCard>
            </div>
        )
    }

    // Profile steps — rendered inside scrollable main
    return (
        <div className="flex items-center justify-center h-full p-6">
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-2xl"
                className="w-full sm:max-w-[618px] border-2 border-white rounded-xl shadow-none"
            >
                <div className="space-y-6">
                    <div className="space-y-1">
                        <Typography as="h2" font="sub-heading" className="font-bold">{meta[screen]}</Typography>
                    </div>
                    <Stepper screen={screen} isAgent={isAgent} />

                    {!isAgent && screen === "step1" && <Step1Basic    onNext={() => setScreen("step2")} onSkip={() => router.push("/home")} />}
                    {!isAgent && screen === "step2" && <Step2Academic onBack={() => setScreen("step1")} onNext={() => setScreen("step3")} onSkip={() => router.push("/home")} />}
                    {!isAgent && screen === "step3" && <Step3Work     onBack={() => setScreen("step2")} />}

                    {isAgent && screen === "step1" && <AgentStep1 onNext={() => setScreen("step2")} onSkip={() => router.push("/home")} />}
                    {isAgent && screen === "step2" && <AgentStep2 onBack={() => setScreen("step1")} onNext={() => setScreen("step3")} onSkip={() => router.push("/home")} />}
                    {isAgent && screen === "step3" && <AgentStep3 onBack={() => setScreen("step2")} />}
                </div>
            </BluryCard>
        </div>
    )
}

export default function ProfilePage() {
    return <Suspense><ProfileContent /></Suspense>
}
