"use client"

import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

export function LogoutButton() {
    const router = useRouter()
    const { logout } = useAuth()

    const handleLogout = async () => {
        await logout.mutateAsync()
        router.replace("/login")
    }

    return (
        <button
            onClick={handleLogout}
            disabled={logout.isPending}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:text-black/80 text-sm font-medium transition-colors"
        >
            <LogOut className="size-4 shrink-0" />
            {logout.isPending ? "Signing out..." : "Sign out"}
        </button>
    )
}
