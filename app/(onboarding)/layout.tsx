import { Suspense } from "react"
import { OnboardingLayoutInner } from "./onboarding/_component/OnboardingLayoutInner"

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense>
            <OnboardingLayoutInner>{children}</OnboardingLayoutInner>
        </Suspense>
    )
}
