"use client"

import { Suspense } from "react"
import { ForgotPasswordForm } from "../_component/ForgotPasswordForm"

function ForgotPasswordContent() {
    return (
        <div className="size-full min-h-screen flex items-center justify-center p-8 sm:p-16">
            <ForgotPasswordForm />
        </div>
    )
}

export default function ForgotPasswordPage() {
    return <Suspense><ForgotPasswordContent /></Suspense>
}
