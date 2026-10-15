"use client"

import { LogOut } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

export function LogoutButton() {
    const { logout } = useAuth()

    const handleLogout = async () => {
        try {
            await logout.mutateAsync()
        } finally {
            // Full reload drops Next's client router cache and all in-memory state of the old user.
            window.location.replace("/login")
        }
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
