import { Suspense } from "react"
import { AuthLayoutInner } from "./_component/AuthLayoutInner"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense>
            <AuthLayoutInner>{children}</AuthLayoutInner>
        </Suspense>
    )
}
