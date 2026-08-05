"use client"

import { AuthMode, UserRole } from "@/types"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { LoginForm } from "./LoginForm"
import { SignupStepHandler } from './SignupStepHandler'
const VALID_ROLES = ["partner", "university-partner", "student"]

interface Props {
    mode: AuthMode
    role: UserRole
}

function SizeControll({ children }: { children: React.ReactNode }) {
    return (
        <div className="p-4 sm:p-0 size-full min-h-screen flex-center">
            {children}
        </div>
    )
}

export const AuthController = ({ mode, role }: Props) => {
    const router = useRouter()

    useEffect(() => {
        if (mode === AuthMode.SIGNUP && !VALID_ROLES.includes(role)) {
            router.replace("/")
        }
    }, [mode, role, router])

    if (mode === AuthMode.LOGIN) {
        return (
            <SizeControll>
                <LoginForm />
            </SizeControll>
        )
    }

    if (mode === AuthMode.SIGNUP) {
        return (
            <SizeControll>
                <SignupStepHandler />
            </SizeControll>
        )
    }

    return null
}