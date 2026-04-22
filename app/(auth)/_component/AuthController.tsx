"use client"

import { AuthMode, UserRole } from "@/types"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { LoginForm } from "./LoginForm"
import { SignupForm } from "./SignupForm"

const VALID_ROLES = ["agent", "student"]

interface Props {
    mode: AuthMode
    role: UserRole
}

export const AuthController = ({ mode, role }: Props) => {
    const router = useRouter()

    useEffect(() => {
        if (mode === AuthMode.SIGNUP && !VALID_ROLES.includes(role)) {
            router.replace("/")
        }
    }, [mode, role, router])

    if (mode === AuthMode.LOGIN) {
        return <SizeControll><LoginForm /></SizeControll>
    }

    if (mode === AuthMode.SIGNUP) {
        return <SizeControll><SignupForm /></SizeControll>
    }

    return null
}

function SizeControll({ children }: { children: React.ReactNode }) {
    return (
        <div className="size-full min-h-screen flex-center">
            {children}
        </div>
    )
}
